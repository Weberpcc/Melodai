    #!/usr/bin/env python3
    """
    Flask server to connect the frontend to the MusicGenerationPipeline
    Optimized for performance with async operations, caching, and connection pooling
    """

    import os
    import json
    import time
    import asyncio
    import threading
    from concurrent.futures import ThreadPoolExecutor
    from flask import Flask, request, jsonify, send_file
    from flask_cors import CORS
    from flask_socketio import SocketIO, emit
    from dotenv import load_dotenv
    import sys
    import gc
    import psutil
    from functools import lru_cache

    # Ensure we can import backend modules regardless of where we run from
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(current_dir)
    sys.path.insert(0, parent_dir)

    from backend.main_service import MusicGenerationPipeline
    from backend.music_variations import MusicVariationGenerator
    from backend.model_manager import get_model_manager
    from backend.quality_scorer import QualityScorer
    from backend.feedback_storage import get_feedback_storage
    from backend.audio_processor import AudioProcessor
    from backend.progress_tracker import get_progress_tracker, ProgressUpdate

    # Load environment variables from root directory
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

    app = Flask(__name__)
    CORS(app, 
        origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"])

    # Initialize SocketIO for real-time progress updates
    socketio = SocketIO(app, cors_allowed_origins=["http://localhost:3000", "http://127.0.0.1:3000"])

    # Performance optimizations
    app.config['JSON_SORT_KEYS'] = False
    app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

    # Thread pool for async operations
    executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="melodai-worker")

    # Initialize services with lazy loading
    pipeline = None
    variation_generator = None
    model_manager = None
    quality_scorer = None
    feedback_storage = None
    audio_processor = None

    def get_services():
        """Lazy initialization of services for better startup performance"""
        global pipeline, variation_generator, model_manager, quality_scorer, feedback_storage, audio_processor
        
        if pipeline is None:
            print("🚀 Initializing services...")
            pipeline = MusicGenerationPipeline()
            variation_generator = MusicVariationGenerator()
            model_manager = get_model_manager()
            quality_scorer = QualityScorer()
            feedback_storage = get_feedback_storage()
            audio_processor = AudioProcessor()
            print("✅ Services initialized")
        
        return pipeline, variation_generator, model_manager, quality_scorer, feedback_storage, audio_processor

    @lru_cache(maxsize=128)
    def get_system_info():
        """Cached system information"""
        return {
            'cpu_count': psutil.cpu_count(),
            'memory_total': psutil.virtual_memory().total,
            'memory_available': psutil.virtual_memory().available
        }

    def generate_music_async(data, client_id=None):
        """Async music generation function with progress tracking"""
        pipeline, _, _, quality_scorer, _, _ = get_services()
        
        # Extract parameters from frontend
        prompt = data.get('prompt', '')
        mood = data.get('mood', '')
        tags = data.get('tags', [])
        settings = data.get('settings', {})
        
        print(f"\n🎵 === Music Generation Request ===")
        print(f"📝 Prompt: {prompt}")
        print(f"😊 Mood: {mood}")
        print(f"🏷️  Tags: {tags}")
        print(f"⚙️  Settings: {settings}")
        
        # Build enhanced prompt with mood and tags
        enhanced_input = prompt
        if mood:
            enhanced_input += f" with {mood} mood"
        if tags:
            enhanced_input += f" suitable for {', '.join(tags)}"
        
        print(f"✨ Enhanced Input: {enhanced_input}")
        
        # Map frontend settings to backend parameters
        duration = settings.get('duration', 30)
        temperature = settings.get('creativity', 1.0)
        model = settings.get('model', 'musicgen-medium')
        top_k = settings.get('topK', 250)
        top_p = settings.get('topP', 0.0)
        cfg_scale = settings.get('cfgScale', 3.0)
        
        print(f"🎛️  Mapped Parameters:")
        print(f"   Duration: {duration}s")
        print(f"   Temperature: {temperature:.2f}")
        print(f"   CFG Scale: {cfg_scale}")
        print(f"   Top-K: {top_k}")
        print(f"   Top-P: {top_p}")
        print(f"   Model: {model}")
        
        # Progress callback for WebSocket updates
        def progress_callback(update: ProgressUpdate):
            if client_id:
                socketio.emit('generation_progress', {
                    'stage': update.stage.value,
                    'progress': update.progress,
                    'message': update.message,
                    'timeElapsed': update.time_elapsed,
                    'estimatedRemaining': update.estimated_remaining
                }, room=client_id)
        
        # Run the pipeline with all parameters
        print(f"🚀 Starting generation pipeline...")
        start_time = time.time()
        
        result = pipeline.run_pipeline(
            user_text=enhanced_input,
            duration=duration,
            temperature=temperature,
            cfg_scale=cfg_scale,
            top_k=top_k,
            top_p=top_p,
            progress_callback=progress_callback
        )
        
        generation_time = time.time() - start_time
        print(f"⏱️  Total generation time: {generation_time:.2f}s")
        
        if result['status'] == 'success':
            filename = os.path.basename(result['file_path'])
            audio_url = f"/api/audio/files/{filename}"
            
            print(f"✅ Generation complete!")
            print(f"📁 File path: {result['file_path']}")
            print(f"🔗 Audio URL: {audio_url}")
            print(f"📝 Enhanced prompt: {result['enhanced_prompt']}")
            
            # Score the audio quality asynchronously
            quality_scores = None
            try:
                print(f"🔍 Scoring audio quality...")
                scores = quality_scorer.score_audio(result['file_path'], {
                    'duration': duration,
                    'prompt': enhanced_input
                })
                quality_scores = {
                    'audioQuality': scores['audio_quality'],
                    'durationAccuracy': scores['duration_accuracy'],
                    'silenceDetection': scores['silence_detection'],
                    'dynamicRange': scores['dynamic_range'],
                    'frequencyBalance': scores['frequency_balance'],
                    'overallScore': scores['overall_score']
                }
                print(f"📊 Quality score: {scores['overall_score']:.1f}/100")
            except Exception as e:
                print(f"⚠️  Quality scoring failed: {str(e)}")
            
            # Force garbage collection to free memory
            gc.collect()
            
            return {
                'status': 'success',
                'audioUrl': audio_url,
                'enhancedPrompt': result['enhanced_prompt'],
                'generationTime': generation_time,
                'parameters': result['parameters'],
                'qualityScores': quality_scores
            }
        else:
            return {'error': 'Music generation failed'}

    # WebSocket event handlers
    @socketio.on('connect')
    def handle_connect():
        print(f"🔌 Client connected: {request.sid}")

    @socketio.on('disconnect')
    def handle_disconnect():
        print(f"🔌 Client disconnected: {request.sid}")

    @socketio.on('start_generation')
    def handle_start_generation(data):
        """Handle generation request via WebSocket for real-time progress"""
        try:
            client_id = request.sid
            print(f"🎵 WebSocket generation request from {client_id}")
            
            # Validate required fields
            prompt = data.get('prompt', '').strip()
            if not prompt or len(prompt) < 10:
                emit('generation_error', {'error': 'Prompt must be at least 10 characters long'})
                return
            
            if len(prompt) > 500:
                emit('generation_error', {'error': 'Prompt must be less than 500 characters'})
                return
            
            # Submit to thread pool for async processing with progress updates
            future = executor.submit(generate_music_async, data, client_id)
            
            # Handle result in a separate thread to avoid blocking
            def handle_result():
                try:
                    result = future.result(timeout=300)  # 5 minute timeout
                    if result.get('error'):
                        socketio.emit('generation_error', result, room=client_id)
                    else:
                        socketio.emit('generation_complete', result, room=client_id)
                except Exception as e:
                    print(f"❌ WebSocket Generation Error: {str(e)}")
                    socketio.emit('generation_error', {'error': f'Generation failed: {str(e)}'}, room=client_id)
            
            threading.Thread(target=handle_result, daemon=True).start()
            
        except Exception as e:
            print(f"❌ WebSocket Error: {str(e)}")
            emit('generation_error', {'error': str(e)})

    @app.route('/api/generate', methods=['POST'])
    def generate_music():
        """
        Main endpoint for music generation with async processing
        Expects JSON payload with prompt, mood, tags, and settings
        """
        try:
            data = request.get_json()
            
            # Validate required fields
            prompt = data.get('prompt', '').strip()
            if not prompt or len(prompt) < 10:
                return jsonify({
                    'error': 'Prompt must be at least 10 characters long'
                }), 400
            
            if len(prompt) > 500:
                return jsonify({
                    'error': 'Prompt must be less than 500 characters'
                }), 400
            
            # Submit to thread pool for async processing
            future = executor.submit(generate_music_async, data)
            result = future.result(timeout=300)  # 5 minute timeout
            
            if result.get('error'):
                return jsonify(result), 500
            else:
                return jsonify(result)
                
        except Exception as e:
            print(f"❌ Generation Error: {str(e)}")
            return jsonify({
                'error': f'Generation failed: {str(e)}'
            }), 500

    @app.route('/api/progress/<generation_id>', methods=['GET'])
    def get_generation_progress(generation_id):
        """Get current progress for a generation"""
        try:
            progress_tracker = get_progress_tracker()
            progress = progress_tracker.get_progress(generation_id)
            
            if progress:
                return jsonify({
                    'status': 'success',
                    'progress': {
                        'stage': progress.stage.value,
                        'progress': progress.progress,
                        'message': progress.message,
                        'timeElapsed': progress.time_elapsed,
                        'estimatedRemaining': progress.estimated_remaining
                    }
                })
            else:
                return jsonify({'error': 'Generation not found'}), 404
                
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/audio/presets', methods=['GET'])
    def get_audio_presets():
        """Get available audio effect presets"""
        try:
            _, _, _, _, _, audio_processor = get_services()
            presets = audio_processor.get_effect_presets()
            
            return jsonify({
                'status': 'success',
                'presets': presets
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/audio/files/<filename>')
    def serve_audio(filename):
        """
        Serve generated audio files with proper CORS headers
        """
        try:
            pipeline, _, _, _, _, _ = get_services()
            # Use the same output directory as the pipeline
            audio_path = os.path.join(pipeline.output_dir, filename)
            
            print(f"🔍 Looking for audio file: {audio_path}")
            print(f"� LFile exists: {os.path.exists(audio_path)}")
            
            if os.path.exists(audio_path):
                response = send_file(audio_path, mimetype='audio/mpeg')
                response.headers['Access-Control-Allow-Origin'] = '*'
                response.headers['Access-Control-Allow-Methods'] = 'GET'
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
                print(f"✅ Serving audio file: {filename}")
                return response
            
            # Check cache directory if not in output directory
            cache_path = os.path.join(pipeline.cache_manager.cache_dir, filename)
            print(f"🔍 Checking cache directory: {cache_path}")
            if os.path.exists(cache_path):
                response = send_file(cache_path, mimetype='audio/mpeg')
                response.headers['Access-Control-Allow-Origin'] = '*'
                response.headers['Access-Control-Allow-Methods'] = 'GET'
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
                print(f"✅ Serving cached audio file: {filename}")
                return response
                
            else:
                print(f"❌ Audio file not found in output or cache: {filename}")
                # List files in directory for debugging
                if os.path.exists(pipeline.output_dir):
                    files = os.listdir(pipeline.output_dir)
                    print(f"📂 Files in output directory: {files}")
                return jsonify({'error': 'Audio file not found'}), 404
        except Exception as e:
            print(f"❌ Error serving audio file {filename}: {e}")
            return jsonify({'error': str(e)}), 500

    @app.route('/')
    def home():
        """
        Root endpoint - shows server status
        """
        return jsonify({
            'message': '🎵 MelodAI Backend Server is running!',
            'status': 'online',
            'endpoints': {
                'generate': '/api/generate',
                'health': '/api/health',
                'models': '/api/models'
            },
            'frontend_url': 'http://localhost:3000'
        })

    @app.route('/api/health', methods=['GET'])
    def health_check():
        """
        Health check endpoint
        """
        return jsonify({
            'status': 'healthy',
            'timestamp': time.time(),
            'pipeline_ready': pipeline is not None
        })

    @app.route('/api/models', methods=['GET'])
    def get_models():
        """
        Return available models with detailed information
        """
        try:
            _, _, model_manager, _, _, _ = get_services()
            models = model_manager.list_available_models()
            
            # Format for frontend
            formatted_models = []
            for model in models:
                formatted_models.append({
                    'id': model['name'],
                    'name': model['display_name'],
                    'description': model['description'],
                    'params': model['params'],
                    'speed': model['speed'],
                    'quality': model['quality'],
                    'memoryGB': model['memory_gb'],
                    'maxDuration': model['max_duration'],
                    'estimatedTime': model_manager.estimate_generation_time(model['name'], 30)
                })
            
            return jsonify({
                'models': formatted_models,
                'currentModel': model_manager.current_model_name,
                'loadedModels': list(model_manager.models.keys())
            })
            
        except Exception as e:
            print(f"❌ Error getting models: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/models/load', methods=['POST'])
    def load_model():
        """
        Load a specific model
        """
        try:
            _, _, model_manager, _, _, _ = get_services()
            data = request.get_json()
            model_name = data.get('model')
            
            if not model_name:
                return jsonify({'error': 'Model name is required'}), 400
            
            print(f"📥 Loading model: {model_name}")
            success = model_manager.load_model(model_name)
            
            if success:
                return jsonify({
                    'status': 'success',
                    'model': model_name,
                    'loadedModels': list(model_manager.models.keys())
                })
            else:
                return jsonify({'error': f'Failed to load model {model_name}'}), 500
                
        except Exception as e:
            print(f"❌ Error loading model: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/models/benchmark', methods=['POST'])
    def benchmark_models():
        """
        Benchmark all available models
        """
        try:
            _, _, model_manager, _, _, _ = get_services()
            data = request.get_json()
            test_prompt = data.get('prompt', 'upbeat electronic music')
            test_duration = data.get('duration', 10)
            
            print(f"🏁 Starting model benchmark...")
            results = model_manager.benchmark_models(test_prompt, test_duration)
            
            return jsonify({
                'status': 'complete',
                'results': results,
                'testPrompt': test_prompt,
                'testDuration': test_duration
            })
            
        except Exception as e:
            print(f"❌ Benchmark error: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/generate-variations', methods=['POST'])
    def generate_variations():
        """
        Generate multiple variations of the same prompt
        """
        try:
            data = request.get_json()
            
            prompt = data.get('prompt', '')
            mood = data.get('mood', '')
            tags = data.get('tags', [])
            settings = data.get('settings', {})
            num_variations = data.get('numVariations', 3)
            
            print(f"\n🎨 === Variation Generation Request ===")
            print(f"📝 Prompt: {prompt}")
            print(f"🔢 Number of variations: {num_variations}")
            
            if not prompt or len(prompt.strip()) < 10:
                return jsonify({'error': 'Prompt must be at least 10 characters long'}), 400
            
            # Build enhanced prompt
            enhanced_input = prompt
            if mood:
                enhanced_input += f" with {mood} mood"
            if tags:
                enhanced_input += f" suitable for {', '.join(tags)}"
            
            # Extract parameters
            duration = settings.get('duration', 30)
            temperature = settings.get('creativity', 1.0)
            cfg_scale = settings.get('cfgScale', 3.0)
            top_k = settings.get('topK', 250)
            top_p = settings.get('topP', 0.0)
            
            print(f"🚀 Generating {num_variations} variations...")
            start_time = time.time()
            
            # Generate variations
            variations = variation_generator.generate_variations(
                base_prompt=enhanced_input,
                num_variations=num_variations,
                duration=duration,
                base_temperature=temperature,
                base_cfg=cfg_scale,
                base_top_k=top_k,
                base_top_p=top_p,
                output_dir=pipeline.output_dir
            )
            
            generation_time = time.time() - start_time
            print(f"⏱️  Total generation time: {generation_time:.2f}s")
            
            # Format response
            results = []
            for var in variations:
                filename = os.path.basename(var['file_path'])
                results.append({
                    'audioUrl': f"/api/audio/files/{filename}",
                    'variationNumber': var['variation_number'],
                    'parameters': var['variation_params'],
                    'metadata': var['metadata']
                })
            
            print(f"✅ Generated {len(results)} variations successfully")
            
            return jsonify({
                'status': 'success',
                'variations': results,
                'enhancedPrompt': enhanced_input,
                'generationTime': generation_time
            })
            
        except Exception as e:
            print(f"❌ Variation Generation Error: {str(e)}")
            return jsonify({'error': f'Variation generation failed: {str(e)}'}), 500

    @app.route('/api/extend-music', methods=['POST'])
    def extend_music():
        """
        Extend existing music to a longer duration
        """
        try:
            data = request.get_json()
            
            audio_filename = data.get('audioFilename', '')
            prompt = data.get('prompt', '')
            target_duration = data.get('targetDuration', 60)
            settings = data.get('settings', {})
            
            print(f"\n🔄 === Music Extension Request ===")
            print(f"📁 Original file: {audio_filename}")
            print(f"🎯 Target duration: {target_duration}s")
            
            if not audio_filename:
                return jsonify({'error': 'Audio filename is required'}), 400
            
            # Get full path to original audio
            original_path = os.path.join(pipeline.output_dir, audio_filename)
            
            if not os.path.exists(original_path):
                return jsonify({'error': 'Original audio file not found'}), 404
            
            # Extract parameters
            temperature = settings.get('creativity', 1.0)
            cfg_scale = settings.get('cfgScale', 3.0)
            top_k = settings.get('topK', 250)
            top_p = settings.get('topP', 0.0)
            
            print(f"🚀 Extending music...")
            start_time = time.time()
            
            # Extend music
            result = variation_generator.extend_music(
                original_audio_path=original_path,
                prompt=prompt,
                target_duration=target_duration,
                temperature=temperature,
                cfg_coef=cfg_scale,
                top_k=top_k,
                top_p=top_p,
                output_dir=pipeline.output_dir
            )
            
            generation_time = time.time() - start_time
            
            if result.get('error'):
                return jsonify({'error': result['error']}), 500
            
            if not result.get('extended'):
                return jsonify({
                    'status': 'no_extension_needed',
                    'message': result.get('message', 'No extension needed')
                })
            
            filename = os.path.basename(result['file_path'])
            
            print(f"✅ Music extended successfully")
            print(f"⏱️  Extension time: {generation_time:.2f}s")
            
            return jsonify({
                'status': 'success',
                'audioUrl': f"/api/audio/files/{filename}",
                'originalDuration': result['original_duration'],
                'finalDuration': result['final_duration'],
                'generationTime': generation_time
            })
            
        except Exception as e:
            print(f"❌ Extension Error: {str(e)}")
            return jsonify({'error': f'Music extension failed: {str(e)}'}), 500

    @app.route('/api/batch-generate', methods=['POST'])
    def batch_generate():
        """
        Generate music for multiple prompts at once
        """
        try:
            data = request.get_json()
            
            prompts = data.get('prompts', [])
            settings = data.get('settings', {})
            
            print(f"\n📦 === Batch Generation Request ===")
            print(f"📝 Number of prompts: {len(prompts)}")
            
            if not prompts or len(prompts) == 0:
                return jsonify({'error': 'At least one prompt is required'}), 400
            
            if len(prompts) > 10:
                return jsonify({'error': 'Maximum 10 prompts allowed per batch'}), 400
            
            # Extract parameters
            duration = settings.get('duration', 30)
            temperature = settings.get('creativity', 1.0)
            cfg_scale = settings.get('cfgScale', 3.0)
            top_k = settings.get('topK', 250)
            top_p = settings.get('topP', 0.0)
            
            print(f"🚀 Starting batch generation...")
            start_time = time.time()
            
            results = []
            for i, prompt_data in enumerate(prompts):
                try:
                    prompt = prompt_data.get('prompt', '').strip()
                    mood = prompt_data.get('mood', '')
                    tags = prompt_data.get('tags', [])
                    
                    if not prompt or len(prompt) < 10:
                        results.append({
                            'status': 'error',
                            'error': 'Prompt too short',
                            'prompt': prompt
                        })
                        continue
                    
                    # Build enhanced prompt
                    enhanced_input = prompt
                    if mood:
                        enhanced_input += f" with {mood} mood"
                    if tags:
                        enhanced_input += f" suitable for {', '.join(tags)}"
                    
                    print(f"\n🎵 Generating {i+1}/{len(prompts)}: {prompt[:50]}...")
                    
                    # Generate music
                    result = pipeline.run_pipeline(
                        user_text=enhanced_input,
                        duration=duration,
                        temperature=temperature,
                        cfg_scale=cfg_scale,
                        top_k=top_k,
                        top_p=top_p
                    )
                    
                    if result['status'] == 'success':
                        filename = os.path.basename(result['file_path'])
                        results.append({
                            'status': 'success',
                            'audioUrl': f"/api/audio/files/{filename}",
                            'prompt': prompt,
                            'enhancedPrompt': result['enhanced_prompt']
                        })
                        print(f"   ✅ Success")
                    else:
                        results.append({
                            'status': 'error',
                            'error': 'Generation failed',
                            'prompt': prompt
                        })
                        print(f"   ❌ Failed")
                        
                except Exception as e:
                    print(f"   ❌ Error: {str(e)}")
                    results.append({
                        'status': 'error',
                        'error': str(e),
                        'prompt': prompt_data.get('prompt', '')
                    })
            
            generation_time = time.time() - start_time
            successful = sum(1 for r in results if r['status'] == 'success')
            
            print(f"\n✅ Batch generation complete: {successful}/{len(prompts)} successful")
            print(f"⏱️  Total time: {generation_time:.2f}s")
            
            return jsonify({
                'status': 'complete',
                'results': results,
                'totalTime': generation_time,
                'successful': successful,
                'total': len(prompts)
            })
            
        except Exception as e:
            print(f"❌ Batch Generation Error: {str(e)}")
            return jsonify({'error': f'Batch generation failed: {str(e)}'}), 500

    @app.route('/api/feedback', methods=['POST'])
    def submit_feedback():
        """
        Submit user feedback for a generation
        """
        try:
            data = request.get_json()
            
            feedback = {
                'id': str(int(time.time() * 1000)),  # Simple ID generation
                'generationId': data.get('generationId'),
                'rating': data.get('rating'),
                'thumbsUp': data.get('thumbsUp'),
                'category': data.get('category'),
                'comment': data.get('comment'),
                'timestamp': int(time.time() * 1000)
            }
            
            # Store feedback using the feedback storage system
            _, _, _, _, feedback_storage, _ = get_services()
            success = feedback_storage.store_feedback(feedback)
            
            # Also log to console
            print(f"📝 User Feedback Received:")
            print(f"   Generation ID: {feedback['generationId']}")
            print(f"   Rating: {feedback['rating']}/5 stars")
            print(f"   Thumbs: {feedback['thumbsUp']}")
            print(f"   Category: {feedback['category']}")
            if feedback['comment']:
                print(f"   Comment: {feedback['comment']}")
            
            if success:
                return jsonify({
                    'status': 'success',
                    'feedback': feedback
                })
            else:
                return jsonify({'error': 'Failed to store feedback'}), 500
            
        except Exception as e:
            print(f"❌ Feedback error: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/feedback/stats', methods=['GET'])
    def get_feedback_stats():
        """
        Get aggregate feedback statistics
        """
        try:
            _, _, _, _, feedback_storage, _ = get_services()
            stats = feedback_storage.get_feedback_stats()
            return jsonify({
                'status': 'success',
                'stats': stats
            })
            
        except Exception as e:
            print(f"❌ Feedback stats error: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/feedback/all', methods=['GET'])
    def get_all_feedback():
        """
        Get all feedback entries
        """
        try:
            _, _, _, _, feedback_storage, _ = get_services()
            limit = request.args.get('limit', 50, type=int)
            feedback_list = feedback_storage.get_all_feedback(limit)
            
            return jsonify({
                'status': 'success',
                'feedback': feedback_list,
                'count': len(feedback_list)
            })
            
        except Exception as e:
            print(f"❌ Get feedback error: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/cache/stats', methods=['GET'])
    def get_cache_stats():
        """
        Get cache statistics
        """
        try:
            pipeline, _, _, _, _, _ = get_services()
            stats = pipeline.cache_manager.get_stats()
            return jsonify({
                'status': 'success',
                'stats': stats
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/cache/clear', methods=['POST'])
    def clear_cache():
        """
        Clear the music cache
        """
        try:
            pipeline, _, _, _, _, _ = get_services()
            pipeline.cache_manager.clear()
            return jsonify({
                'status': 'success',
                'message': 'Cache cleared successfully'
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/performance', methods=['GET'])
    def get_performance_metrics():
        """
        Get server performance metrics
        """
        try:
            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Get process metrics
            process = psutil.Process()
            process_memory = process.memory_info()
            
            metrics = {
                'system': {
                    'cpu_percent': cpu_percent,
                    'memory_total': memory.total,
                    'memory_available': memory.available,
                    'memory_percent': memory.percent,
                    'disk_total': disk.total,
                    'disk_free': disk.free,
                    'disk_percent': disk.percent
                },
                'process': {
                    'memory_rss': process_memory.rss,
                    'memory_vms': process_memory.vms,
                    'cpu_percent': process.cpu_percent(),
                    'num_threads': process.num_threads()
                },
                'services': {
                    'pipeline_loaded': pipeline is not None,
                    'model_manager_loaded': model_manager is not None,
                    'quality_scorer_loaded': quality_scorer is not None
                }
            }
            
            return jsonify({
                'status': 'success',
                'metrics': metrics,
                'timestamp': time.time()
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/optimize', methods=['POST'])
    def optimize_performance():
        """
        Trigger performance optimizations
        """
        try:
            # Force garbage collection
            gc.collect()
            
            # Clear any cached data if needed
            try:
                pipeline, _, _, _, _, _ = get_services()
                if pipeline and hasattr(pipeline, 'cache_manager'):
                    stats_before = pipeline.cache_manager.get_stats()
            except:
                # Services not initialized yet, skip cache operations
                pass
            
            # Get memory info after optimization
            process = psutil.Process()
            memory_after = process.memory_info()
            
            return jsonify({
                'status': 'success',
                'message': 'Performance optimization completed',
                'memory_after_mb': memory_after.rss / 1024 / 1024,
                'timestamp': time.time()
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/audio/enhance', methods=['POST'])
    def enhance_audio():
        """Apply audio enhancement effects to a generated audio file"""
        try:
            data = request.get_json()
            audio_filename = data.get('audioFilename', '')
            effects = data.get('effects', {})
            preset = data.get('preset')
            
            if not audio_filename:
                return jsonify({'error': 'Audio filename is required'}), 400
            
            pipeline, _, _, _, _, audio_processor = get_services()
            
            # Get full path to audio file
            audio_path = os.path.join(pipeline.output_dir, audio_filename)
            
            if not os.path.exists(audio_path):
                return jsonify({'error': 'Audio file not found'}), 404
            
            print(f"🎨 Enhancing audio: {audio_filename}")
            
            # Apply preset or custom effects
            if preset:
                enhanced_path = audio_processor.apply_preset(audio_path, preset)
            else:
                enhanced_path = audio_processor.enhance_audio(audio_path, effects)
            
            filename = os.path.basename(enhanced_path)
            
            print(f"✅ Enhanced audio created: {enhanced_path}")
            print(f"📁 Enhanced filename: {filename}")
            print(f"🔍 File exists: {os.path.exists(enhanced_path)}")
            
            # Ensure the enhanced file is in the output directory
            expected_path = os.path.join(pipeline.output_dir, filename)
            if enhanced_path != expected_path:
                print(f"🔄 Moving enhanced file from {enhanced_path} to {expected_path}")
                import shutil
                shutil.move(enhanced_path, expected_path)
                enhanced_path = expected_path
            
            print(f"🎯 Final enhanced path: {enhanced_path}")
            print(f"✅ Final file exists: {os.path.exists(enhanced_path)}")
            
            return jsonify({
                'status': 'success',
                'audioUrl': f"/api/audio/files/{filename}",
                'enhancedFile': filename
            })
            
        except Exception as e:
            print(f"❌ Enhancement error: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/audio/preview-effect', methods=['POST'])
    def preview_effect():
        """Preview an effect on a short segment of audio"""
        try:
            data = request.get_json()
            audio_filename = data.get('audioFilename', '')
            effect_type = data.get('effectType', '')
            effect_params = data.get('effectParams', {})
            duration = data.get('duration', 5.0)
            
            if not audio_filename or not effect_type:
                return jsonify({'error': 'Audio filename and effect type are required'}), 400
            
            pipeline, _, _, _, _, audio_processor = get_services()
            
            audio_path = os.path.join(pipeline.output_dir, audio_filename)
            
            if not os.path.exists(audio_path):
                return jsonify({'error': 'Audio file not found'}), 404
            
            preview_path = audio_processor.preview_effect(
                audio_path, effect_type, effect_params, duration
            )
            
            filename = os.path.basename(preview_path)
            
            return jsonify({
                'status': 'success',
                'previewUrl': f"/api/audio/files/{filename}"
            })
            
        except Exception as e:
            print(f"❌ Preview error: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/audio/convert', methods=['POST'])
    def convert_audio():
        """Convert audio to different format"""
        try:
            data = request.get_json()
            audio_filename = data.get('audioFilename', '')
            output_format = data.get('format', 'mp3')
            quality_settings = data.get('qualitySettings', {})
            
            if not audio_filename:
                return jsonify({'error': 'Audio filename is required'}), 400
            
            pipeline, _, _, _, _, audio_processor = get_services()
            
            audio_path = os.path.join(pipeline.output_dir, audio_filename)
            
            if not os.path.exists(audio_path):
                return jsonify({'error': 'Audio file not found'}), 404
            
            print(f"🔄 Converting {audio_filename} to {output_format}")
            
            converted_path = audio_processor.convert_format(
                audio_path, output_format, quality_settings
            )
            
            filename = os.path.basename(converted_path)
            
            return jsonify({
                'status': 'success',
                'audioUrl': f"/api/audio/files/{filename}",
                'format': output_format,
                'filename': filename
            })
            
        except Exception as e:
            print(f"❌ Conversion error: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/audio/analyze', methods=['POST'])
    def analyze_audio():
        """Analyze audio file and return detailed metrics"""
        try:
            data = request.get_json()
            audio_filename = data.get('audioFilename', '')
            
            if not audio_filename:
                return jsonify({'error': 'Audio filename is required'}), 400
            
            pipeline, _, _, _, _, audio_processor = get_services()
            
            audio_path = os.path.join(pipeline.output_dir, audio_filename)
            
            if not os.path.exists(audio_path):
                return jsonify({'error': 'Audio file not found'}), 404
            
            print(f"🔍 Analyzing audio: {audio_filename}")
            
            analysis = audio_processor.analyze_audio(audio_path)
            
            return jsonify({
                'status': 'success',
                'analysis': analysis
            })
            
        except Exception as e:
            print(f"❌ Analysis error: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/audio/compare', methods=['POST'])
    def compare_audio():
        """Compare original and processed audio"""
        try:
            data = request.get_json()
            original_filename = data.get('originalFilename', '')
            processed_filename = data.get('processedFilename', '')
            
            if not original_filename or not processed_filename:
                return jsonify({'error': 'Both filenames are required'}), 400
            
            pipeline, _, _, _, _, audio_processor = get_services()
            
            original_path = os.path.join(pipeline.output_dir, original_filename)
            processed_path = os.path.join(pipeline.output_dir, processed_filename)
            
            if not os.path.exists(original_path) or not os.path.exists(processed_path):
                return jsonify({'error': 'One or both audio files not found'}), 404
            
            comparison = audio_processor.compare_audio(original_path, processed_path)
            
            return jsonify({
                'status': 'success',
                'comparison': comparison
            })
            
        except Exception as e:
            print(f"❌ Comparison error: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/audio/batch-export', methods=['POST'])
    def batch_export_audio():
        """Batch export audio files with effects and format conversion"""
        try:
            data = request.get_json()
            audio_filenames = data.get('audioFilenames', [])
            output_formats = data.get('formats', ['mp3'])
            effects = data.get('effects')
            quality_settings = data.get('qualitySettings')
            
            if not audio_filenames:
                return jsonify({'error': 'At least one audio file is required'}), 400
            
            pipeline, _, _, _, _, audio_processor = get_services()
            
            # Get full paths
            audio_paths = []
            for filename in audio_filenames:
                path = os.path.join(pipeline.output_dir, filename)
                print(f"🔍 Checking file: {path}")
                print(f"📁 File exists: {os.path.exists(path)}")
                if os.path.exists(path):
                    # Check file size
                    file_size = os.path.getsize(path)
                    print(f"📊 File size: {file_size} bytes")
                    if file_size > 0:
                        audio_paths.append(path)
                    else:
                        print(f"⚠️  Skipping empty file: {filename}")
                else:
                    print(f"❌ File not found: {filename}")
            
            if not audio_paths:
                # List available files for debugging
                if os.path.exists(pipeline.output_dir):
                    available_files = os.listdir(pipeline.output_dir)
                    print(f"📂 Available files: {available_files}")
                return jsonify({'error': 'No valid audio files found'}), 404
            
            print(f"📦 Batch exporting {len(audio_paths)} files to {output_formats}")
            
            zip_path = audio_processor.batch_export(
                audio_paths, output_formats, effects, quality_settings
            )
            
            zip_filename = os.path.basename(zip_path)
            
            return jsonify({
                'status': 'success',
                'zipUrl': f"/api/audio/files/{zip_filename}",
                'zipFilename': zip_filename,
                'filesProcessed': len(audio_paths)
            })
            
        except Exception as e:
            print(f"❌ Batch export error: {str(e)}")
            return jsonify({'error': str(e)}), 500

    if __name__ == '__main__':
        print("🎵 Starting MelodAI Backend Server...")
        print("🔗 Frontend can connect to: http://localhost:5000")
        print("🔌 WebSocket support enabled for real-time progress")
        print("📊 Health check: http://localhost:5000/api/health")
        print("📈 Performance metrics: http://localhost:5000/api/performance")
        print("🎨 Audio processing: /api/audio/enhance, /api/audio/analyze")
        print("⏳ Services will be loaded on first request for faster startup...")
        
        try:
            socketio.run(
                app,
                host='0.0.0.0',
                port=5000,
                debug=False,
                use_reloader=False
            )
        except Exception as e:
            print(f"❌ Server error: {e}")
            sys.exit(1)
        finally:
            # Cleanup on shutdown
            if executor:
                executor.shutdown(wait=True)
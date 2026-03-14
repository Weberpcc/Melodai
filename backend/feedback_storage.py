"""
Feedback Storage System
Handles storing and retrieving user feedback data
"""

import json
import os
from datetime import datetime
from typing import List, Dict, Optional
import csv


class FeedbackStorage:
    """
    Manages feedback storage in JSON and CSV formats
    Ready for database integration
    """
    
    def __init__(self, storage_dir: str = "feedback_data"):
        self.storage_dir = storage_dir
        self.json_file = os.path.join(storage_dir, "feedback.json")
        self.csv_file = os.path.join(storage_dir, "feedback.csv")
        
        # Create storage directory
        os.makedirs(storage_dir, exist_ok=True)
        
        # Initialize files if they don't exist
        self._initialize_storage()
    
    def _initialize_storage(self):
        """Initialize storage files if they don't exist"""
        
        # Initialize JSON file
        if not os.path.exists(self.json_file):
            with open(self.json_file, 'w') as f:
                json.dump([], f)
        
        # Initialize CSV file with headers
        if not os.path.exists(self.csv_file):
            with open(self.csv_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'id', 'generation_id', 'rating', 'thumbs_up', 'category', 
                    'comment', 'timestamp', 'date_created'
                ])
    
    def store_feedback(self, feedback: Dict) -> bool:
        """
        Store feedback in both JSON and CSV formats
        
        Args:
            feedback: Feedback dictionary with id, generationId, rating, etc.
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Add timestamp if not present
            if 'timestamp' not in feedback:
                feedback['timestamp'] = int(datetime.now().timestamp() * 1000)
            
            # Add human-readable date
            feedback['date_created'] = datetime.fromtimestamp(
                feedback['timestamp'] / 1000
            ).strftime('%Y-%m-%d %H:%M:%S')
            
            # Store in JSON
            self._store_json(feedback)
            
            # Store in CSV
            self._store_csv(feedback)
            
            print(f"✅ Feedback stored: {feedback['id']}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to store feedback: {str(e)}")
            return False
    
    def _store_json(self, feedback: Dict):
        """Store feedback in JSON file"""
        try:
            # Load existing data
            with open(self.json_file, 'r') as f:
                data = json.load(f)
            
            # Add new feedback
            data.append(feedback)
            
            # Keep only last 1000 entries
            if len(data) > 1000:
                data = data[-1000:]
            
            # Save back to file
            with open(self.json_file, 'w') as f:
                json.dump(data, f, indent=2)
                
        except Exception as e:
            print(f"❌ JSON storage error: {str(e)}")
    
    def _store_csv(self, feedback: Dict):
        """Store feedback in CSV file"""
        try:
            with open(self.csv_file, 'a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([
                    feedback.get('id', ''),
                    feedback.get('generationId', ''),
                    feedback.get('rating', ''),
                    feedback.get('thumbsUp', ''),
                    feedback.get('category', ''),
                    feedback.get('comment', ''),
                    feedback.get('timestamp', ''),
                    feedback.get('date_created', '')
                ])
                
        except Exception as e:
            print(f"❌ CSV storage error: {str(e)}")
    
    def get_feedback_by_generation(self, generation_id: str) -> Optional[Dict]:
        """Get feedback for a specific generation"""
        try:
            with open(self.json_file, 'r') as f:
                data = json.load(f)
            
            for feedback in reversed(data):  # Get most recent
                if feedback.get('generationId') == generation_id:
                    return feedback
            
            return None
            
        except Exception as e:
            print(f"❌ Error retrieving feedback: {str(e)}")
            return None
    
    def get_all_feedback(self, limit: int = 100) -> List[Dict]:
        """Get all feedback, most recent first"""
        try:
            with open(self.json_file, 'r') as f:
                data = json.load(f)
            
            return list(reversed(data))[:limit]
            
        except Exception as e:
            print(f"❌ Error retrieving all feedback: {str(e)}")
            return []
    
    def get_feedback_stats(self) -> Dict:
        """Get aggregate feedback statistics"""
        try:
            with open(self.json_file, 'r') as f:
                data = json.load(f)
            
            if not data:
                return {
                    'total_feedback': 0,
                    'average_rating': 0,
                    'rating_distribution': {},
                    'category_distribution': {},
                    'thumbs_up_ratio': 0
                }
            
            # Calculate statistics
            total = len(data)
            ratings = [f.get('rating', 0) for f in data if f.get('rating')]
            categories = [f.get('category', '') for f in data if f.get('category')]
            thumbs = [f.get('thumbsUp') for f in data if f.get('thumbsUp') is not None]
            
            # Rating distribution
            rating_dist = {}
            for rating in range(1, 6):
                rating_dist[str(rating)] = ratings.count(rating)
            
            # Category distribution
            category_dist = {}
            for category in categories:
                category_dist[category] = category_dist.get(category, 0) + 1
            
            # Thumbs up ratio
            thumbs_up_count = sum(1 for t in thumbs if t is True)
            thumbs_ratio = thumbs_up_count / len(thumbs) if thumbs else 0
            
            return {
                'total_feedback': total,
                'average_rating': sum(ratings) / len(ratings) if ratings else 0,
                'rating_distribution': rating_dist,
                'category_distribution': category_dist,
                'thumbs_up_ratio': thumbs_ratio
            }
            
        except Exception as e:
            print(f"❌ Error calculating stats: {str(e)}")
            return {}


# Global feedback storage instance
feedback_storage = FeedbackStorage()


def get_feedback_storage() -> FeedbackStorage:
    """Get the global feedback storage instance"""
    return feedback_storage


if __name__ == "__main__":
    # Test the feedback storage
    storage = FeedbackStorage()
    
    # Test feedback
    test_feedback = {
        'id': 'test_123',
        'generationId': 'gen_456',
        'rating': 4,
        'thumbsUp': True,
        'category': 'perfect',
        'comment': 'Great music!'
    }
    
    # Store feedback
    storage.store_feedback(test_feedback)
    
    # Retrieve feedback
    retrieved = storage.get_feedback_by_generation('gen_456')
    print(f"Retrieved: {retrieved}")
    
    # Get stats
    stats = storage.get_feedback_stats()
    print(f"Stats: {stats}")
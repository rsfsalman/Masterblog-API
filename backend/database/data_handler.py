import json
import sys
import os
from datetime import datetime


class UpdatePostError(Exception):
    """Base exception for errors related to updating a post."""

    def __init__(self, message="An error occurred while updating the post."):
        self.message = message
        super().__init__(self.message)


class NoValidDataError(UpdatePostError):
    """Exception for the case where no valid data is provided for updating a post."""

    def __init__(self, message="No valid data provided for update."):
        self.message = message
        super().__init__(self.message)


class PostNotFoundError(UpdatePostError):
    """Exception for the case where the requested post is not found."""

    def __init__(self, message="The requested post was not found."):
        self.message = message
        super().__init__(self.message)


class DataHandler:
    """
    A class that handles data related to blog posts.

    Attributes:
    - _posts (dict): A dictionary containing blog post data.
    - _file_name (str): The name of the file storing the blog post data.
    - _database_path (str): The full path to the blog post database file.

    Methods:
    - __init__(self, file_name): Initializes the DataHandler instance.
    - is_valid_json_file(self): Checks if the specified file is a valid JSON file.
    - count(self): Returns the total number of blog posts.
    - fetch_post_by_id(self, post_id): Fetches a blog post based on its ID.
    - request_unique_id(self): Generates a unique ID for a new blog post.
    - increase_post_likes(self, post_id): Increases the like count for a blog post.
    - save_post(self, new_post): Saves a new blog post.
    - delete_post(self, post_id): Deletes a blog post based on its ID.
    - update_post(self, post_id, updated_data): Updates the content of a blog post.
    - search_posts(self, request_args): Searches and filters blog posts based on criteria.
    - get_posts(self, sort_by='title', direction='asc', page=1, page_size=10):
        Retrieves and paginates blog posts.
    """

    def __init__(self, file_name):
        """
        Initializes the DataHandler instance.

        :param file_name: (str) The name of the file storing the blog post data.
        """
        self._posts = []
        self._file_name = file_name

        current_directory = os.getcwd()
        self._database_path = os.path.join(current_directory, 'database', self._file_name)
        print(self._database_path)
        if self.is_valid_json_file():
            print(f"\nThe '{self._file_name}' posts database file has been loaded successfully.")
        else:
            print(f"Error: {self._file_name} is not a valid JSON file.")
            sys.exit()

    def is_valid_json_file(self):
        """
        Checks if the specified file is a valid JSON file.

        :return: (bool) True if the file is a valid JSON file, False otherwise.
        """
        if not self._database_path.lower().endswith('.json'):
            return False
        try:
            with open(self._database_path, 'r', encoding='utf-8') as file:
                self._posts = json.load(file)
                return True
        except FileNotFoundError:
            # File does not exist, create it
            with open(self._database_path, 'w', encoding='utf-8') as file:
                json.dump(self._posts, file, indent=4)
            return True
        except json.JSONDecodeError:
            return False

    def count(self):
        """
        Returns the total number of blog posts.

        :return: (int) The total number of blog posts.
        """
        return len(self._posts)

    def fetch_post_by_id(self, post_id):
        """
        Fetches a blog post from a list of blog posts based on its ID.

        :param post_id: (int) The ID of the blog post to fetch.

        :return: tuple, A tuple containing the blog post and its index in the list if found,
                    otherwise returns None and -1.
        """
        self.read_posts()
        for idx, post in enumerate(self._posts):
            if post['id'] == post_id:
                return post, idx
        return None, -1

    def request_unique_id(self):
        """
        Generates a unique ID for a new blog post.

        :return: (int) A unique ID for a new blog post.
        """
        if len(self._posts) == 0:
            return 1
        return self._posts[-1]['id'] + 1

    def read_posts(self):
        """
        Reads blog posts from the database file and updates the internal posts data.

        This function reads the contents of the blog post database file specified during
        initialization and updates the internal `_posts` attribute with the loaded data.
        """
        # Invoke is_valid_json_file() to guarantee the file is loaded. If there's a necessity
        # to recreate the file, this operation will be performed. Additionally, any existing
        # posts will be saved to the newly created file  in case the file has been moved
        # or deleted by someone.
        if self.is_valid_json_file():
            pass

        # with open(self._database_path, 'r') as file:
        #     # Load the JSON data from the file and update the internal posts data
        #     self._posts = json.load(file)

    def write_posts(self):
        """
        Writes the current state of blog posts to the database file.

        This function writes the current state of the internal `_posts` attribute to
        the blog post database file specified during initialization. The data is written
        in JSON format with an indentation of 4 spaces.
        """
        # Open the database file in write mode
        with open(self._database_path, 'w') as file:
            # Write the internal posts data to the file in JSON format with indentation
            json.dump(self._posts, file, indent=4)

    def increase_post_likes(self, post_id):
        """
        Increases the like count for a blog post.

        :param post_id: (int) The ID of the blog post to update likes for.

        :return: (bool) True if the like count was increased successfully, False otherwise.
        """
        for post in self._posts:
            req_post_id = post.get('id')
            if req_post_id == post_id:
                post['likes'] = post.get('likes', 0) + 1
                self.write_posts()
                return True
        return False

    def save_post(self, new_post):
        """
        Saves a new blog post.

        :param new_post: (dict) The dictionary containing the new blog post data.
        """
        self.read_posts()
        self._posts.append(new_post)
        self.write_posts()

    def delete_post(self, post_id):
        """
        Deletes a blog post based on its ID.

        :param post_id: (int) The ID of the blog post to delete.

        :return: (bool) True if the blog post was deleted successfully, False otherwise.
        """
        self.read_posts()
        for post in self._posts:
            if post['id'] == post_id:
                self._posts.remove(post)
                self.write_posts()
                return True
        return False

    def update_post(self, post_id, updated_data):
        """
        Updates the content of a blog post.

        :param post_id: (int) The ID of the blog post to update.
        :param updated_data: (dict) The dictionary containing the updated data for the blog post.

        :return: The updated blog post data if successful, None otherwise.
        """
        post, idx = self.fetch_post_by_id(post_id)
        if post is None:
            raise PostNotFoundError("Post not found for update.")

        if not updated_data or all(value is None or value == '' for value in updated_data.values()):
            raise NoValidDataError("No valid data provided for update.")

        updated_post = {'id': post['id'],
                        'date': post['date'],
                        'author': updated_data.get('author', post['author']),
                        'title': updated_data.get('title', post['title']),
                        'content': updated_data.get('content', post['content']),
                        'sort_date': post['sort_date']}

        if 'likes' in post:
            updated_post['likes'] = post['likes']

        self._posts[idx] = updated_post
        self.write_posts()
        return updated_post

    def search_posts(self, request_args):
        """
        Searches and filters blog posts based on criteria.

        :param request_args: (dict) Dictionary containing search criteria and pagination parameters.

        :return: (dict) A dictionary containing the filtered and paginated blog posts.
        """
        # Define a mapping of search_by values to corresponding post keys
        search_by_mapping = {'title': 'title', 'author': 'author', 'content': 'content',
                             'date': 'date'}

        # Extract search criteria from request_args
        search_for = request_args.get('search_for', '').lower()

        # Get the corresponding post key based on search_by
        post_key = search_by_mapping.get(request_args.get('search_by', ''), 'title')

        # Filter posts based on the search criteria
        filtered_posts = [post for post in self._posts if search_for in post[post_key].lower()]

        # If no posts match the search criteria, return an empty response
        if not filtered_posts:
            return {'posts': [], 'totalPosts': 0}

        # Get sort parameters from the query string
        sort_by, direction = request_args.get('sort_by', ''), request_args.get('direction', 'asc')

        # Get pagination parameters from the query string
        page, page_size = request_args.get('page', 1), request_args.get('page_size', 10)

        # Calculate the start and end indices for the current page
        start_index, end_index = (page - 1) * page_size, (page - 1 + 1) * page_size

        current_page_posts = sort_if_necessary(sort_by, direction, filtered_posts,
                                               start_index, end_index)
        # Create the response data containing the current page posts and total posts count
        return {'posts': current_page_posts, 'totalPosts': len(filtered_posts)}

    def get_posts(self, sort_by='title', direction='asc', page=1, page_size=10):
        """
            Retrieves and paginates blog posts.

            :param sort_by: (str) The field to sort the blog posts by (default: 'title').
            :param direction: (str) The sorting order ('asc' for ascending, 'desc' for descending,
                default: 'asc').
            :param page: (int) The current page number (default: 1).
            :param page_size: (int) The number of posts per page (default: 10).

            :return: (dict) A dictionary containing the current page posts and total posts count.
        """
        # Calculate the start and end indices for the current page
        start_index = (page - 1) * page_size
        end_index = start_index + page_size

        # Read blog posts from the data source
        self.read_posts()

        if sort_by in ['title', 'content', 'author', 'date']:
            if sort_by == 'date':
                # Sort by date in ascending or descending order
                sorted_posts = sorted(self._posts,
                                      key=lambda post: datetime.strptime(post['sort_date'],
                                                                         "%a, %b %d, %Y %H:%M:%S"),
                                      reverse=direction == 'desc')
            else:
                # Sort by other fields (title, content, author) in ascending or descending order
                sorted_posts = sorted(self._posts,
                                      key=lambda post: (post[sort_by][0].lower(), post[sort_by]),
                                      reverse=direction == 'desc')
            current_page_posts = sorted_posts[start_index:end_index]
        else:
            # If no specific sorting criteria is specified, use the original order
            current_page_posts = self._posts[start_index:end_index]

        # Create the response data containing the current page posts and total posts count
        response_data = {
            'posts': current_page_posts,
            'totalPosts': self.count()
        }
        return response_data


def sort_if_necessary(sort_by, direction, filtered_posts, start_index, end_index):
    """
    Sorts a list of blog posts based on specified parameters if sorting is necessary.

    Args:
        sort_by (str): The field by which to sort the blog posts ('title', 'content', 'author',
                        'date').
        direction (str): The sorting direction ('asc' for ascending, 'desc' for descending).
        filtered_posts (list): The list of blog posts to be sorted.
        start_index (int): The starting index for pagination.
        end_index (int): The ending index for pagination.

    Returns:
        list: A sorted sublist of blog posts based on the specified sorting parameters.

    Sorting Logic:
    - If 'sort_by' is in ['title', 'content', 'author', 'date'], sorts the list accordingly.
    - For 'date', uses the 'sort_date' field in ascending or descending order.
    - For other fields ('title', 'content', 'author'), uses a case-insensitive sort.
    - Returns a sublist of sorted blog posts based on the provided pagination indices.

    Example Usage:
    sorted_posts = sort_if_necessary('date', 'asc', blog_posts, 0, 10)

    Example Response:
    [
        {
            "id": 1,
            "date": "Wed, Dec 14, 2023",
            "author": "John Doe",
            "title": "Sample Title",
            "content": "Sample Content",
            "sort_date": "Wed, Dec 14, 2023 12:34:56"
        },
        ...
    ]
    """
    if sort_by in ['title', 'content', 'author', 'date']:
        if sort_by == 'date':
            # Sort by date in ascending or descending order
            sorted_posts = sorted(filtered_posts,
                                  key=lambda post: datetime.strptime(post['sort_date'],
                                                                     "%a, %b %d, %Y %H:%M:%S"),
                                  reverse=direction == 'desc')
        else:
            # Sort by other fields (title, content, author) in ascending or descending order
            sorted_posts = sorted(filtered_posts,
                                  key=lambda post: (post[sort_by][0].lower(), post[sort_by]),
                                  reverse=direction == 'desc')
        return sorted_posts[start_index:end_index]
    return filtered_posts[start_index:end_index]

# Backend version 2.0 of the Masterblog API, developed by Salman Farhat,
# encompasses the following key features:
#
#  1- Support for Posts Listing and rendering.
#  2- Capability to Add a New Post.
#  3- Ability to Delete a Post.
#  4- Functionality to Update a Post.
#  5- Search options by Title, Author, Content, and Date within the posts.
#  6- Sorting of posts by Title, Author, Content, and Date.
#  7- Sorting of search results by Title, Author, Content, and Date.
#  8- Implementation of Pagination
#  9- JSON storage to persistently store all posts in a JSON file.
# 10- Aesthetic blog design and layout achieved through CSS and JavaScript code modifications
# 11- Robust error handling.
# 12- Utilization of both custom-defined and standard dialog boxes.

"""
backend_app.py
This module implements a Flask web application for managing blog posts.
It includes endpoints for creating, retrieving, updating, and deleting blog posts,
as well as handling search requests based on various parameters.

The application uses Flask extensions such as CORS for Cross-Origin Resource Sharing,
Flask Limiter for rate limiting, and Werkzeug for handling HTTP exceptions.

The application defines a 'DataHandler' class from the 'data_handler' module
to manage the storage and retrieval of blog posts.

Global Constants:
- supported_media_types: List of supported media types for Content-Type validation.
- allowed_sort_search_values: List of allowed values for sorting and searching.
- allowed_direction_values: List of allowed values for sorting direction.
- allowed_page_size_values: List of allowed values for pagination page size.

Functions:
- check_for_headers: Function to check for required headers and validate Content-Type.
- like_post: Function to increase the like count for a blog post identified by its ID.
- edit_post: Function to handle 'PUT' and 'DELETE' requests to edit an existing blog post
    identified by its ID.
- handle_search: Function to handle search requests for blog posts based on specified parameters.
- handle_posts: Function to handle requests for retrieving all blog posts or creating a new post.

Endpoints:
- /api/posts/<int:post_id> (PUT, DELETE): Edit a blog post identified by its ID.
- /api/like/<int:post_id> (POST): Like a blog post identified by its ID.
- /api/posts/search (GET): Handle search requests for blog posts based on specified parameters.
- /api/posts (GET, POST): Handle requests for retrieving all blog posts or creating a new post.

To run the application, execute this module. The application will run on http://0.0.0.0:5002/.
"""

import json
from datetime import datetime

from flask import (Flask, jsonify, request)

from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.exceptions import BadRequest

from database.data_handler import (DataHandler, PostNotFoundError,
                                   UpdatePostError, NoValidDataError)

# Initialize our web application instance
app = Flask(__name__)

# Enable Cross-Origin Resource Sharing (CORS) for all routes
CORS(app)

# Initializes the rate limiting functionalist
limiter = Limiter(app=app, key_func=get_remote_address)


posts_storage = DataHandler("blog_posts.json")

# Define the supported media types
supported_media_types = ['application/json', 'application/xml']

# Define the allowed sort_by values
allowed_sort_search_values = ['title', 'author', 'date', 'content']

# Define the allowed direction values
allowed_direction_values = ['asc', 'desc']

# Define the allowed direction values
allowed_page_size_values = [10, 20, 50, 100]


def check_for_headers():
    """
    Check for the presence of required headers and validate the Content-Type.

    Returns a tuple containing a boolean indicating whether an exception occurred
    in the first block, a Flask response object, and parsed JSON data.

    The function checks for the 'Content-Type' header in the request. If the header
    is missing, it returns a 400 Bad Request response. If the header is present, it
    validates the 'Content-Type' against a list of supported media types. If the
    'Content-Type' is not supported, it returns a 415 Unsupported Media Type response.
    If the 'Content-Type' is supported, it attempts to parse JSON data from the request
    body. If parsing fails, it returns a 400 Bad Request response.

    :return: A tuple (exception_in_first_block, response, data)
             - exception_in_first_block: A boolean indicating whether an exception occurred
               in the first block (header validation).
             - response: Flask response object with an error message and status code.
             - data: Parsed JSON data from the request body, or None if parsing failed.
    """
    # Default response for invalid method or missing required data
    response = jsonify({'error': 'Invalid method or missing required data'}), 405
    data = None
    exception_in_first_block = False  # Flag to track exceptions in the first block

    # Check if 'Content-Type' header is missing
    if 'Content-Type' not in request.headers:
        response = jsonify({'error': 'Content-Type header is missing'}), 400
    else:
        # Get the Content-Type from the header
        content_type = request.headers['Content-Type']
        exception_in_first_block = False

        # Check if the Content-Type is in the list of supported media types
        if content_type not in supported_media_types:
            # 415 is the HTTP status code for Unsupported Media Type
            response = jsonify({'error': 'Unsupported media type'}), 415
        else:
            # Parse JSON data from the request body
            try:
                data = request.get_json()
            except BadRequest:
                # Handle JSON decoding errors
                response = jsonify({'error': 'Failed to decode JSON object: Expecting property'
                                             ' name enclosed in double quotes.'}), 400
                exception_in_first_block = True

            except json.JSONDecodeError:
                # Handle JSON decoding errors
                response = jsonify({'error': 'Failed to decode JSON object: Expecting property'
                                             ' name enclosed in double quotes.'}), 400
                exception_in_first_block = True
    return exception_in_first_block, response, data


@app.route('/api/posts/<int:post_id>', methods=['PUT', 'DELETE'])
@limiter.limit("20 per minute")
def edit_post(post_id):
    """
        Edit a post identified by its ID.
        Args:
            post_id (int): The unique identifier for the post.
        Returns:
            JSON: A JSON response containing the edited post data or an error message.
    """
    response = jsonify({'error': 'Invalid method or missing required data'}), 405

    if request.method == 'DELETE':
        # Attempt to delete the post
        try:
            success = posts_storage.delete_post(post_id)
            if success:
                return jsonify({'message':
                                f'Post with id {post_id} has been deleted successfully.',
                                'totalPosts': posts_storage.count()})
            raise PostNotFoundError()
        except UpdatePostError as update_error:
            response = jsonify({'error': str(update_error)}), 404

    elif request.method == 'PUT':
        # Attempt to update the post, 'PUT' request
        exception_in_first_block, response, data = check_for_headers()

        # Attempt to update the post with the provided data
        if not exception_in_first_block:
            try:
                post = posts_storage.update_post(post_id, data)
                response = jsonify(post)
            except NoValidDataError as data_error:
                response = jsonify({'error': str(data_error)}), 400

            except UpdatePostError as update_error:
                response = jsonify({'error': str(update_error)}), 404

            except json.JSONDecodeError:
                response = jsonify({'error': 'Failed to decode JSON object: Expecting property'
                                             ' name enclosed in double quotes.'}), 400
    return response


@app.route('/api/like/<int:post_id>', methods=['POST'])
@limiter.limit("20 per minute")
def like_post(post_id):
    """
    Like a post identified by its ID.

    Args:
        post_id (int): The unique identifier for the post.

    Returns:
        JSON: A JSON response indicating success or failure of the like operation.
    """
    # Increase the like count for the specified post
    success = posts_storage.increase_post_likes(post_id)

    # Check if the post was found and liked successfully
    if success:
        return jsonify({'message': 'Post Liked successfully'})
    return jsonify({'error': 'Post not found'}), 404


# This error handler will be called for rate-limiting errors (HTTP 429)
@limiter.request_filter
def handle_rate_limit_exceeded():
    """
    Error handler function for rate-limiting errors (HTTP 429).

    This function is intended to be used as an error handler for rate-limiting scenarios,
    specifically when an HTTP 429 status code is encountered. It is decorated with
    `@limiter.request_filter` to handle rate-limiting errors triggered by a request.

    Returns:
       tuple: A tuple containing a JSON response and the HTTP status code 429.
              The JSON response includes an 'error' key with a message indicating that
              the rate limit has been exceeded, and the status code is set to 429.
    """
    return jsonify({'error': 'Rate limit exceeded. Please try again later.'}), 429


@app.route('/api/posts/search', methods=['GET'])
@limiter.limit("20 per minute",  error_message="Rate limit exceeded")
def handle_search():
    """
    Handle a search request for posts based on specified parameters.

    Returns:
        JSON: A JSON response containing the search results or an error message.
    """
    # Get the sort_by parameter from the query string
    sort_by = request.args.get('sort', default='', type=str)

    # Check if the sort_by value is allowed
    if sort_by and sort_by not in allowed_sort_search_values:
        return jsonify({'error': 'Bad Request: Invalid sort_by value'}), 400

    # Get the sort_by parameter from the query string
    direction = request.args.get('direction', default='asc', type=str)

    # Check if the direction value is allowed
    if direction and direction not in allowed_direction_values:
        return jsonify({'error': 'Bad Request: Invalid direction value'}), 400

    # Get the search_by parameter from the query string
    search_by = request.args.get('search_by', default='title', type=str)

    # Check if the search_by value is allowed
    if search_by and search_by not in allowed_sort_search_values:
        return jsonify({'error': 'Bad Request: Invalid search_by value'}), 400

    # Get the page_size parameter from the query string
    page_size = int(request.args.get('pageSize', 10))

    # Check if the page_size value is allowed
    if page_size and page_size not in allowed_page_size_values:
        return jsonify({'error': 'Bad Request: Invalid pageSize value'}), 400

    request_args = {
        'search_for': request.args.get('search_for', default='', type=str),
        'search_by': search_by,
        'sort_by': sort_by,
        'direction': direction,
        'page': int(request.args.get('page', 1)),
        'page_size': page_size
    }
    return jsonify(posts_storage.search_posts(request_args))


@app.route('/api/posts', methods=['GET', 'POST'])
# @limiter.limit("20 per minute")
def handle_posts():
    """
	handle_posts
	"""
    if request.method == 'POST':
        try:
            data = request.get_json()
        except BadRequest:
            return jsonify({'error': 'Failed to decode JSON object: Expecting property'
                                     ' name enclosed in double quotes.'}), 400

        # author = request.form.get('author', None)
        # content = request.form.get('content', None)
        # title = request.form.get('title', None)
        title = data.get('title', None)
        author = data.get('author', None)
        content = data.get('content', None)

        if not title or not content or not author:
            missing_fields = []
            if not title:
                missing_fields.append('title')
            if not author:
                missing_fields.append('author')
            if not content:
                missing_fields.append('content')
            if missing_fields:
                missing_fields[0] = missing_fields[0].capitalize()
            error_message = f"Missing required field(s): {', '.join(missing_fields)}"
            return jsonify({'error': error_message}), 400

        today = datetime.today()
        date = today.strftime("%a, %b %d, %Y")
        sort_date = today.strftime('%a, %b %d, %Y %H:%M:%S')
        unique_id = posts_storage.request_unique_id()

        new_post = {
            'id': unique_id,
            'date': date,
            'author': author,
            'title': title,
            'content': content,
            'sort_date': sort_date
        }
        posts_storage.save_post(new_post)

        # Return the new post as the response
        return jsonify(new_post), 201

    # it is a GET method, so return all the posts taking sort into consideration.
    sort_by = request.args.get('sort', default='', type=str)

    # Check if the sort_by value is allowed
    if sort_by and sort_by not in allowed_sort_search_values:
        return jsonify({'error': 'Bad Request: Invalid sort value'}), 400

    direction = request.args.get('direction', default='asc', type=str)
    if direction and direction not in allowed_direction_values:
        return jsonify({'error': 'Bad Request: Invalid direction value'}), 400

    # Get pagination parameters from the query string
    page = int(request.args.get('page', 1))
    page_size = int(request.args.get('pageSize', 10))

    return jsonify(posts_storage.get_posts(sort_by, direction, page, page_size))


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5002, debug=True)

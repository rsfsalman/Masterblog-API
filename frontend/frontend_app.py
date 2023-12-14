"""
MasterBlog Frontend: Flask Web Application

This Python script defines the frontend of the MasterBlog application,
which seamlessly integrates with the backend API to provide a powerful web interface
for blog management.

MasterBlog supports full CRUD operations (Create, Read, Update, and Delete)
for effortless interaction with blog posts.

Usage:
- Ensure Flask is installed: `pip install Flask`
- Run the script to start the MasterBlog Frontend server.
- Open a web browser and navigate to http://0.0.0.0:5001/ to access the MasterBlog web interface.

Dependencies:
- Flask: The web framework used for building the MasterBlog Frontend.

Script Structure:
1. Flask Application Initialization:
   - Creates a Flask application instance named 'app' for the MasterBlog Frontend.

2. Route Definition:
   - Defines a route for the root URL ('/') that handles HTTP GET requests.
   - The route calls the 'home' function, which renders the "index.html" template.

3. Server Execution:
   - Checks if the script is being run directly (not imported).
   - If so, starts the Flask development server on the specified host and port (0.0.0.0:5001)
     with debugging enabled.

Note:
- This script represents the frontend of the MasterBlog application and relies
  on the MasterBlog API backend.
- Ensure that the MasterBlog-API backend is running and accessible.

Author:
Salman Farhat
"""


from flask import Flask, render_template

app = Flask(__name__)

@app.route('/', methods=['GET'])
def home():
    """
    Render the home page.

    This function is responsible for handling HTTP GET requests to the '/' route.
    It renders the "index.html" template, providing users with the main interface to interact with
    blog posts.

    Returns:
    - A rendered HTML page based on the "index.html" template.
    """
    return render_template("index.html")


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5001, debug=True)

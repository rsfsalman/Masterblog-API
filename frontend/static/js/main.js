// Global constants
const MAX_PAGINATION_BUTTONS = 5;
const HALF_PAGINATION_CYCLE = Math.floor(MAX_PAGINATION_BUTTONS / 2);

const NULL_COMMAND = 0;
const ADD_POST_COMMAND = 1;
const DELETE_POST_COMMAND = 2;
const UPDATE_POST_COMMAND = 3;
const LIST_POST_COMMAND = 4;
const SEARCH_COMMAND = 5
const SORT_COMMAND = 6;

// Global variables
let defaultPageSize = 10;
let isAscendingOrder = true;
let inSortMode = false;
let inSearchMode = false;
let pageNumber = 1;
let tempPage = pageNumber;
let lastCommand = NULL_COMMAND;

// -----------------------------------------------------------------------------
// Window Load Event
// -----------------------------------------------------------------------------
/**
 * Function that runs once the window is fully loaded.
 * It attempts to retrieve the API base URL from local storage,
 * and if a base URL is found, it sets the value of the 'api-base-url' input
 * and loads posts using the 'loadPosts' function.
 */
window.onload = function() {
    // Call the initialize function to set up event listeners and behaviors
    initialize();

    // Attempt to retrieve the API base URL from the local storage
    var savedBaseUrl = localStorage.getItem('apiBaseUrl');
    // If a base URL is found in local storage, load the posts
    if (savedBaseUrl) {
        document.getElementById('api-base-url').value = savedBaseUrl;
        createPaginationContainer();
        pageNumber = 1
        loadPosts(pageNumber);
    }
}

/**
 * Function to initialize event listeners and behaviors.
 * It selects the '#search-input' element and the '#search-button' element,
 * adds an 'input' event listener to the search input,
 * associating the 'searchChange' function with the event.
 * Additionally, it adds a 'keypress' event listener to the search input
 * to detect the 'Enter' key press, triggering the 'click_button' function
 * with the search button as an argument.
 * It also selects the anchor element with the id 'add-post-link' and adds a 'click'
 * event listener to it.
 * The click event listener prevents the default behavior (scrolling to the top)
 * and calls the 'displayAddPostDialog' function.
 */
function initialize() {
    // Select the input element with the id 'search-input'
    const searchInput = document.querySelector('#search-input');

    // Select the search button element with the id 'search-button'
    const searchButton = document.querySelector("#search-button");

    // Add an event listener for the 'input' event on the search input
    searchInput.addEventListener('input', searchChange)

    // Add an event listener for the 'keypress' event on the search input
    searchInput.addEventListener('keypress', function(event) {
        // Check if the key pressed is 'Enter'
        if (event.key === 'Enter') {
            // Send a click to the search button!
            click_button(searchButton);
        }
    });

    // Select the anchor element with the id 'add-post-link'
    const linkElement = document.getElementById('add-post-link');

    // Attach a click event listener to the href
    linkElement.addEventListener('click', function(event) {
        // Prevent the default behavior (scrolling to the top)
        event.preventDefault();

        // Call the displayAddPostDialog function to display the add post dialog
        displayAddPostDialog();
    });
}

/**
 * Retrieves the API base URL from local storage.
 * If the URL is found, it is returned; otherwise, it logs a warning and returns null.
 *
 * @returns {string|null} The API base URL if found; otherwise, null.
 */
function getAPIBaseUrl() {
    // Attempt to retrieve the API base URL from local storage
    var savedBaseUrl = localStorage.getItem('apiBaseUrl');

    // If a base URL is found in local storage, return it
    if (savedBaseUrl) {
        return savedBaseUrl;
    } else {
        // If no base URL is found, log a warning and return null
        console.warn('API base URL not found in local storage');
        return null; // Returning null, but you might want to return a default URL or handle differently
    }
}


// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------
/**
 * Clicks a button, adding a visual indication of the click by temporarily
 * applying a "clicked" class and triggering a click event after a delay.
 *
 * @param {HTMLElement} button - The button element to be clicked.
 */
function click_button(button) {
    /**
     * Adds a "clicked" class to the button, simulating a visual click effect.
     * Initiates a delayed removal of the class and triggers a click event.
     */
    button.classList.add("clicked");
    // Adjust the delay (in milliseconds) to 200ms.
    setTimeout(function() {
        button.classList.remove("clicked");
        button.click();
    }, 200); // Adjust the delay (in milliseconds) as needed
}

/**
 * Plays a beep sound using an HTML audio element.
 * The function creates an audio element, sets the source to a beep sound file, and plays the audio.
 * Note: Ensure the correct file path for the beep sound is provided.
 */
function playBeep() {
    // Create an audio element
    var audio = new Audio('../static/sounds/Uh oh.mp3');

    // Play the audio
    audio.play();
}

/**
 * Displays a result message in a quick panel, indicating success or failure.
 *
 * @param {string} param - The message to be displayed.
 * @param {boolean} success - A flag indicating whether the result is a success (true) or an error (false).
 */
function displayResult(param, success) {
    // Retrieve the quick panel element
    const quickPanel =  document.getElementById('quick-panel');

    // Display the quick panel
    quickPanel.style.display = 'flex';

    // Log the function call
    console.log("display result is called!")

    // Retrieve the quick message element within the quick panel
    const quickMessageElement = document.querySelector('.quick-message');

    // Construct the text to be displayed based on success or failure
    var text;
    if (!success) {
        // If it's an error, play a beep sound and format the error message
        playBeep();
        text = "Error: '<span style='color: red; font-weight: bold;'>" + param + "</span>'";
    } else {
        // If it's a success, use the provided message
        text = param;
    }

    // Set the text content of the quick message element
    quickMessageElement.innerHTML = text;

    // Add classes to show the quick panel
    quickPanel.classList.add('show');

    // Log the function call again
    console.log("display result is called!!!")

    // Set a timeout to hide the quick panel after 2 seconds (adjust as needed)
    setTimeout(function() {
      quickPanel.classList.remove('show');
    }, 2000);
}

/**
 * Displays a confirmation panel for deleting a post.
 *
 * @param {string} postTitle - The title of the post to be deleted.
 * @return {Promise<boolean>} - A promise that resolves to true if confirmed, false otherwise.
 */
function showConfirmationPanel(postTitle) {
    // Play a beep sound
    playBeep();

    // Retrieve confirmation panel and overlay modal elements
    const confirmationPanel =  document.getElementById('confirmation-panel');
    const overlayModal =  document.getElementById('overlay');

    // Display the overlay modal and confirmation panel
    overlayModal.style.display = 'block';
    confirmationPanel.style.display = 'flex';

    // Set initial result value to false
    let result = false;

    // Add 'show' class to overlay modal and confirmation panel
    overlayModal.classList.add('show');
    confirmationPanel.classList.add('show');

    // Retrieve confirm and cancel buttons
    const confirmModal = document.getElementById('confirmButton');
    const cancelModal = document.getElementById('cancelButton');

    // Construct the confirmation message text
    const text = "Are you sure you want to delete this '<span style='color: red; font-weight: bold;'>" + postTitle + "</span>' post?";

    // Assign the text to the paragraph element
    document.getElementById("confirmation-text").innerHTML = text;

    // Return a promise for handling asynchronous confirmation
    return new Promise((resolve) => {
        // Add event listeners to confirm and cancel buttons
        cancelModal.addEventListener("click", () => {
            // Hide the confirmation panel and resolve with false
            confirmationPanel.classList.remove('show');
            overlayModal.classList.remove('show');
            resolve(false);
        });

        confirmModal.addEventListener("click", () => {
            // Hide the confirmation panel and resolve with true
            confirmationPanel.classList.remove('show');
            overlayModal.classList.remove('show');
            resolve(true);
        });
    });
}


// -----------------------------------------------------------------------------
// Dialog Functions
// -----------------------------------------------------------------------------
/**
 * Handles events related to the dialog, such as closing and validation.
 *
 * @param {Event} event - The event object triggering the function.
 */
function dialogFilter(event) {
    // Select relevant elements
    const modal = document.querySelector("#modal");
    const closeModal = document.querySelector("#cancel-button");
    const overlayModal =  document.getElementById('overlay');
    const submitModal = document.querySelector('#submit-button');

    // Disable the entire page while the dialog is open
    overlayModal.classList.add('disable-entire-page');
    overlayModal.classList.remove('enable-entire-page');

    // Get form values
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const content = document.getElementById('content').value;

    // Validate form fields when the submit button is clicked
    if (event.target === submitModal) {
        if (title.trim() === '' || author.trim() === '' || content.trim() === '')
            return;
    }

    // Close the dialog when Escape key is pressed, Cancel button is clicked, or Submit button is clicked
    if (event.key === 'Escape' || event.target === closeModal || event.target === submitModal) {
        modal.setAttribute("closing", "");
        modal.addEventListener(
            "animationend",
            () => {
                // Enable the entire page after the dialog is closed
                overlayModal.classList.remove('disable-entire-page');
                overlayModal.classList.add('enable-entire-page');

                // Reset attributes and close the dialog
                modal.removeAttribute("closing");
                modal.close();

                // Remove the event listeners after the dialog is closed
                document.removeEventListener('keydown', dialogFilter);
                closeModal.removeEventListener('click', dialogFilter);
            },
            { once: true }
        );
    }
}

/**
 * Displays the "Add Post" dialog with pre-populated or cleared fields for creating a new blog post.
 * Also sets up event listeners for the dialog's buttons and keyboard events.
 */
function displayAddPostDialog() {
    // Select the modal element
    const modal = document.querySelector("#modal");

    // Set the form title and clear or reset form fields
    document.getElementById('form-title').textContent = 'Create Blog Post';
    document.getElementById('title').value = '';
    document.getElementById('author').value = '';
    document.getElementById('content').value = '';

    // Get the blog post form and set its onsubmit handler to the addPost function
    const form =  document.getElementById('blogPostForm');
    form.onsubmit = addPost;

    // Display the modal dialog
    modal.showModal();

    // Select the close and submit buttons
    const closeModal = document.querySelector("#cancel-button");
    const submitModal = document.querySelector('#submit-button');

    // Add event listeners for keyboard events and button clicks to handle dialog actions
    document.addEventListener("keydown", dialogFilter);
    closeModal.addEventListener("click", dialogFilter);
    submitModal.addEventListener("click", dialogFilter);
}

/**
 * Displays the "Update Post" dialog with pre-populated fields based on the provided post object.
 * Also sets up event listeners for the dialog's buttons and keyboard events.
 *
 * @param {object} post - The post object containing details to pre-populate the form.
 */
function displayUpdatePostDialog(post) {
    // Select the modal element
    const modal = document.querySelector("#modal");

    // Create a dynamic title with the post title highlighted in red
    var text = "Update '<span style='color: red; font-weight: bold;'>" + post.title + "</span>' Post";

    // Set the form title and populate form fields with post details
    document.getElementById('form-title').innerHTML = text;
    document.getElementById('title').value = post.title;
    document.getElementById('author').value = post.author;
    document.getElementById('content').value = post.content;

    // Get the blog post form and set its onsubmit handler to the updatePost function with the post parameter
    const form =  document.getElementById('blogPostForm');
    form.onsubmit = function (event) {
        updatePost(event, post)
    }

    // Display the modal dialog
    modal.showModal();

    // Select the close and submit buttons
    const closeModal = document.querySelector("#cancel-button");
    const submitModal = document.querySelector('#submit-button');

    // Add event listeners for keyboard events and button clicks to handle dialog actions
    document.addEventListener("keydown", dialogFilter);
    closeModal.addEventListener("click", dialogFilter);
    submitModal.addEventListener("click", dialogFilter);
}


// -----------------------------------------------------------------------------
// Fetch Functions
// -----------------------------------------------------------------------------
/**
 * Sends a fetch request to the API based on user inputs, retrieves posts, and returns the data.
 *
 * @param {number} page_number - The page number for pagination (default is 1).
 * @returns {Promise} - A promise that resolves with the fetched data or rejects with an error.
 */
function sendFetchRequest(page_number = 1) {
    // Retrieve the base URL from the input field and save it to local storage
    var baseUrl = document.getElementById('api-base-url').value;
    localStorage.setItem('apiBaseUrl', baseUrl);

    // Construct the URL for the API request
    var endpointUrl = baseUrl + '/posts';

    // If sort_by and direction parameters are provided, append them to the URL
    var queryParams = [];
    if (inSortMode) {
        const sortMenu = document.getElementById('sortMenu');
        const sort_by = sortMenu.options[sortMenu.selectedIndex].value;
        sort_direction = isAscendingOrder ? 'asc' : 'desc';

        queryParams.push('sort=' + sort_by);
        queryParams.push('direction=' + sort_direction);
    }

    if (inSearchMode) {
        const searchMenu = document.getElementById('search-menu');
        const search_for = document.getElementById('search-input').value;
        const search_by = searchMenu.options[searchMenu.selectedIndex].value;

        queryParams.push('search_for=' + search_for);
        queryParams.push('search_by=' + search_by);
    }

    // Retrieve selected page size from pageSizeMenu
    const pageSizeMenu = document.getElementById('page-size-menu');
    const pageSize = pageSizeMenu.options[pageSizeMenu.selectedIndex].value;
    queryParams.push('pageSize=' + pageSize);

    // Add page number to queryParams (replace 1 with your desired page number)
    queryParams.push('page=' + page_number);

    // Construct the final URL with query parameters
    if (inSearchMode) {
        // Append search parameters only if inSearchMode is true
        endpointUrl += '/search?' + queryParams.join('&');
    } else if (queryParams.length > 0) {
        // If not inSearchMode but there are sorting parameters, append them to the URL
        endpointUrl += "?" + queryParams.join('&');
    }

    console.log(queryParams);
    return fetch(endpointUrl)
        .then(response => response.json())  // Parse the JSON data from the response
        .then(data => {  // Once the data is ready, we can use it
                    console.log(data.totalPosts)
            return data;
         })
        .catch(error => {
            console.log(error);
            console.error('Error:', error);
            // throw error;  // Re-throw the error to be caught by the calling function
        });
}

/**
 * Loads posts from the API and displays them on the page.
 *
 * @param {number} page_number - The page number for pagination (default is 1).
 */
function loadPosts(page_number=1) {
    console.log("page number =", page_number);

    sendFetchRequest(page_number)
        .then(data => {
            // Check if page_number is greater than 1 and data.posts is not an empty list
            // after a delete command
            if (lastCommand == DELETE_POST_COMMAND) {
                lastCommand = NULL_COMMAND;
                if (data.posts.length == 0 && pageNumber > 1) {

                    // This scenario may occur following a DELETE post command. For instance, if the current page is 5,
                    // and there was only one post on this page. After deleting this post, page number 5 becomes empty.
                    // However, there are still four pages with posts available. It is a prudent move to navigate to the
                    // previous page and remove page 5 from the pagination.
                    pageNumber = Math.max(1, pageNumber - 1); // Ensure page_number is at least 1

                    // load previous page
                    loadPosts(pageNumber);
                } else {
                    // display current page
                     displayPosts(data, page_number);
                }
            } else {
                // display current page
                displayPosts(data, page_number);
            }
        })
        .catch(error => {
            // Log and display an error message if an error occurs
            console.error('Error in fetching or displaying posts:', error);

            //displayResult(error.message, false);
            displayResult(`An error occurred (Status ${error.status}): ${error.error}`, false);
        });
}

// -----------------------------------------------------------------------------
// Display Functions
// -----------------------------------------------------------------------------
/**
 * Displays blog posts on the page based on the provided data and page index.
 *
 * @param {object} data - The data object containing posts and totalPosts information.
 * @param {number} page_index - The current page index for pagination (default is 1).
 */
function displayPosts(data, page_index = 1) {
    // Extract posts and totalPosts from the data
    const posts = data.posts;
    const totalPosts = data.totalPosts;

    // Create pagination based on totalPosts and current page index
    renderPaginationButtons(totalPosts, page_index);

    // Access the container element
    const postsContainer = document.getElementById('container');

    // Clear out the post container first
    postsContainer.innerHTML = '';

    // Create an h1 element
    const headerElement = document.createElement('h1');
    headerElement.textContent = 'Blog Posts';

    // Append the h1 element to the container
    postsContainer.appendChild(headerElement);

    // Create the ul element
    const ulElement = document.createElement("ul")

    if (totalPosts === 0) {
        // Display a message if there are no posts
        const messageElement = document.createElement('div');
        messageElement.textContent = 'No posts available.';
        messageElement.className = 'no-posts-message';
        postsContainer.appendChild(messageElement);
        return;
    } else {
        // Create pagination container and display posts
        createPaginationContainer(totalPosts, page_index);

        // Render the posts
        // For each post in the response, create a new post element and add it to the page
        posts.forEach(post => {
            // code to create and append post elements
            const liElement = document.createElement("li")
            liElement.className = "blog-post"

            const postHeader = document.createElement("div");
            postHeader.className = "blog-post-header";

            const postDate = document.createElement("p");
            postDate.className = "date";
            postDate.innerHTML = `<strong>Date:</strong> ${post.date}`;
            liElement.appendChild(postDate);

            const postTitle = document.createElement("h2");
            postTitle.textContent = post.title;
            postHeader.appendChild(postTitle);

            const postActions = document.createElement("div");
            postActions.className = "blog-post-actions";

            const updateButton = document.createElement("button");
            updateButton.className = "update-button";
            updateButton.textContent = "Update";
            updateButton.onclick = () => displayUpdatePostDialog(post);

            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-button";
            deleteButton.textContent = "Delete";
            deleteButton.onclick = () => deletePost(post.id, post.title);

            postActions.appendChild(updateButton);
            postActions.appendChild(deleteButton);
            postHeader.appendChild(postActions);
            liElement.appendChild(postHeader);

            const authorName = document.createElement("p");
            authorName.className = "author";
            authorName.innerHTML = `<strong>Author:</strong> ${post.author}`;
            liElement.appendChild(authorName);

            const contentParagraph = document.createElement("p");
            contentParagraph.className = "post-content"
            contentParagraph.innerHTML = post.content;
            liElement.appendChild(contentParagraph);

            const postFooter = document.createElement("div");
            postFooter.className = "blog-post-footer";

            const likeButton = document.createElement("button");
            likeButton.className = "like-button";

            const thumbsUpIcon = document.createElement("i");
            thumbsUpIcon.className = "far fa-thumbs-up";
            thumbsUpIcon.style.color = "#007bff";

            const likeCountSpan = document.createElement("span");
            likeCountSpan.className = "like-count";
            likeCountSpan.id = 'like-count-${post.id}';
            likeCountSpan.textContent = post.likes;

            likeButton.appendChild(thumbsUpIcon);
            likeButton.appendChild(likeCountSpan);
            likeButton.onclick = () => likePost(post.id);

            postFooter.appendChild(likeButton);
            liElement.appendChild(postFooter);
            ulElement.appendChild(liElement);
        });

        // Add the posts list to the container.
        postsContainer.appendChild(ulElement)
    }
}

/**
 * Creates or retrieves a pagination container and inserts it into the DOM,
 * allowing users to select the number of posts to display per page.
 */
function createPaginationContainer() {
    // Retrieve or create the pagination container element
    var paginationDiv = document.getElementById('pagination-container');

    // If the pagination container does not exist, create and configure it
    if (!paginationDiv) {
        var paginationDiv = document.createElement('div');
        paginationDiv.className = 'pagination-container';
        paginationDiv.id = "pagination-container"

        // Insert the new div between the existing divs
        document.querySelector('.toolbar-container').insertAdjacentElement('afterend', paginationDiv);

        // Create the select element for choosing the number of posts per page
        const pageSizeMenu = document.createElement("select");
        pageSizeMenu.id = "page-size-menu";
        pageSizeMenu.disabled = false;
        pageSizeMenu.onchange = changePageSize;

        // Create options and append them to the select element
        var options = [10, 20, 50, 100]; // desired page sizes
        options.forEach(function (pageSize) {
            var optionElement = document.createElement("option");
            optionElement.value = pageSize;
            optionElement.text = pageSize + " posts per page";
            pageSizeMenu.appendChild(optionElement);
        });
        // Append the select element to the pagination container
        paginationDiv.appendChild(pageSizeMenu);
    }
}

// -----------------------------------------------------------------------------
// Pagination Functions
// -----------------------------------------------------------------------------
/**
 * Event handler for changing the number of posts displayed per page.
 * Changes the page size and reloads the posts for the first page.
 * This function is typically called when the user selects a new page size.
 */
function changePageSize() {
    // Implementation for changing the page size takes place in renderPaginationButtons function

    // Reset the page number to 1 when changing the page size
    pageNumber = 1;

    // Load posts for the first page with the updated page size
    loadPosts(pageNumber);
}

/**
 * Event handler for switching to a specific page.
 * Switches to the specified page and loads the corresponding posts.
 * @param {number} pageNumber - The page number to switch to.
 */
function switchToPage(page) {
    // Implementation for switching to a specific page

    // Update the global page number variable
    pageNumber = page;

    // Load posts for the selected page
    loadPosts(pageNumber);
}

/**
 * Creates and appends right arrow pagination buttons to navigate to the next and last pages.
 * Buttons are added to the specified container based on the current page index and total pages.
 *
 * @param {number} totalPages - The total number of pages.
 * @param {number} page_index - The current page index (default is 1).
 * @param {HTMLElement} container - The container to which the buttons will be appended.
 */
function createRightPaginationButtons(totalPages, page_index=1, container) {
    // If there are not enough pages to warrant right arrow buttons, exit early
    if (totalPages <= MAX_PAGINATION_BUTTONS)
        return;

    // Flags to determine if the next page and last page buttons are needed
    var nextPageButtonIsNeeded = false;
    var lastPageButtonIsNeeded = false;

    // Check if the next page button is needed
    if (page_index < totalPages) {
        nextPageButtonIsNeeded = true;
    }

    // Check if the last page button is needed
    if (page_index + HALF_PAGINATION_CYCLE < totalPages) {
        lastPageButtonIsNeeded = true;
    }

    // Create and append the next page button if needed
    if (nextPageButtonIsNeeded) {
        const nextPageButton = document.createElement('button');
        nextPageButton.className = 'page-button';
        nextPageButton.textContent = '>';
        nextPageButton.addEventListener('click', () => switchToPage(page_index + 1));
        container.appendChild(nextPageButton);
    }

    // Create and append the last page button if needed
    if (lastPageButtonIsNeeded) {
        const lastPageButton = document.createElement('button');
        lastPageButton.className = 'page-button';
        lastPageButton.textContent = '>>';
        lastPageButton.addEventListener('click', () => switchToPage(totalPages));
        container.appendChild(lastPageButton);
    }
}

/**
 * Creates and appends left arrow pagination buttons to navigate to the previous and first pages.
 * Buttons are added to the specified container based on the current page index and total pages.
 *
 * @param {number} totalPages - The total number of pages.
 * @param {number} page_index - The current page index (default is 1).
 * @param {HTMLElement} container - The container to which the buttons will be appended.
 */
function createLeftPaginationButtons(totalPages, page_index=1, container) {
    // If there are not enough pages to warrant left arrow buttons, exit early
    if (totalPages <= MAX_PAGINATION_BUTTONS)
        return;

    // Flags to determine if the previous page and first page buttons are needed
    var prevPageButtonIsNeeded = false;
    var firstPageButtonIsNeeded = false;

    // Check if the previous page button is needed
    if (page_index > 1) {
        prevPageButtonIsNeeded = true;
    }

    // Check if the first page button is needed
    if (page_index - HALF_PAGINATION_CYCLE > 1) {
        firstPageButtonIsNeeded = true;
    }

    // Create and append the first page button if needed
    if (firstPageButtonIsNeeded) {
        const firstPageButton = document.createElement('button');
        firstPageButton.className = 'page-button';
        firstPageButton.textContent = '<<';
        firstPageButton.addEventListener('click', () => switchToPage(1));
        container.appendChild(firstPageButton);
    }

    // Create and append the previous page button if needed
    if (prevPageButtonIsNeeded) {
        const prevPageButton = document.createElement('button');
        prevPageButton.className = 'page-button';
        prevPageButton.textContent = '<';
        prevPageButton.addEventListener('click', () => switchToPage(page_index - 1));
        container.appendChild(prevPageButton);
    }
}

/**
 * Renders pagination buttons based on the total number of posts, current page index,
 * and the selected page size. Handles the creation and placement of pagination elements.
 *
 * @param {number} totalPosts - The total number of posts.
 * @param {number} page_index - The current page index (default is 1).
 */
function renderPaginationButtons(totalPosts, page_index=1) {
    // Retrieve the selected page size from the page size menu
    const pageSizeMenu = document.getElementById('page-size-menu');
    var selectedPageSize = pageSizeMenu ? pageSizeMenu.value : defaultPageSize;

    // Calculate the total number of pages based on the total posts and selected page size
    const totalPages = Math.ceil(totalPosts / selectedPageSize);

    var pagesContainer = document.getElementById('pages-container');
    if (pagesContainer) {
        // Clear the existing content of the pages container
        pagesContainer.innerHTML = ''; // Set innerHTML to an empty string
    }

    // Check if there is more than one page to display pagination
    if (totalPages >= 1 ) {
        // because there are more than one page so we need a pagination container

        // Retrieve or create the pagination container element
        var paginationDiv = document.getElementById('pagination-container');
        if (!paginationDiv) {
            // Create the pagination container if it doesn't exist
            createPaginationContainer();
            paginationDiv = document.getElementById('pagination-container');
        }

        // Check if there is more than one page to display pagination buttons
        if (totalPages > 1) {
            // Create a new pages container if it doesn't exist
            if (!pagesContainer) {
                pagesContainer = document.createElement('div');
                pagesContainer.id = "pages-container";
                pagesContainer.className = 'pages-container'; // it was 'pages'
            }
            // Create left pagination buttons
            createLeftPaginationButtons(totalPages, page_index, pagesContainer);

            // Calculate the start and last index for the main pagination buttons
            var start_index;
            var last_index;
            if (page_index <= MAX_PAGINATION_BUTTONS - HALF_PAGINATION_CYCLE) {
                start_index = 1;
                last_index = start_index + (2*HALF_PAGINATION_CYCLE);
            } else if (page_index >= totalPages - HALF_PAGINATION_CYCLE) {
                last_index = totalPages;
                start_index = last_index - (2*HALF_PAGINATION_CYCLE);
            } else {
                start_index = page_index - HALF_PAGINATION_CYCLE;
                last_index = page_index + HALF_PAGINATION_CYCLE;
            }

            // Ensure the start and last index are within bounds
            start_index = Math.max(1, start_index);
            last_index = Math.min(totalPages, last_index);

            // Create and append main pagination buttons
            for (let i = start_index; i <= last_index; i++) {
                const button = document.createElement('button');
                button.className = 'page-button';
                button.textContent = i;
                button.addEventListener('click', () => switchToPage(i));
                pagesContainer.appendChild(button);

                // Highlight the current page button
                if (i == page_index) {
                    button.classList.add('hilited-button');
                }
            }

            // Create right pagination buttons
            createRightPaginationButtons(totalPages, page_index, pagesContainer);

            // Append the pages container to the pagination container
            paginationDiv.appendChild(pagesContainer);
        } else {
            // If there's only one page or none, delete the pages container and its children
            if (pagesContainer) {
                pagesContainer.parentNode.removeChild(pagesContainer);
            }
        }
    }
}

// -----------------------------------------------------------------------------
// Post Management Functions
// -----------------------------------------------------------------------------
//
/**
 * Adds a new blog post.
 *
 * Sends a POST request to the API to add a new post with the specified title and content.
 * After successful addition, reloads the posts to reflect the updated state.
 *
 * @param {Event} event - The event object triggering the function.
 */
function addPost(event) {
    // Implementation for adding a new post
        // Prevent the default form submission
    event.preventDefault();

    // Retrieve the values from the input fields
    var baseUrl = getAPIBaseUrl();
    var postTitle = document.getElementById('title').value;
    var postContent = document.getElementById('content').value;
    var postAuthor = document.getElementById('author').value;

    // Create a dictionary/object with form values
    const formData = {
        title: postTitle,
        author: postAuthor,
        content: postContent
    };

    // Use the Fetch API to send a POST request to the /posts endpoint
    fetch(baseUrl + '/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
    })
    .then(response => {
        // Check if the response is successful
        if (response.ok) {
            return response.json();  // Parse the JSON data from the response
        } else {
            // If the response is not ok, check different status codes
            switch (response.status) {
                case 400:
                    throw new Error('Invalid request: Check your data');
                case 500:
                    throw new Error('Internal server error');
                default:
                    throw new Error('Error adding post (${response.status})');
            }
        }
    })
    .then(post => {
        // Log and display a success message
        console.log('Post added:', post);
        var text = "The post '<span style='color: red; font-weight: bold;'>" + post.title + "</span>' has been successfully added!";
        displayResult(text, true);

        // Reload the posts after adding a new one
        loadPosts(pageNumber);
    })
    .catch(error => {
        console.error('Error:', error);  // If an error occurs, log it to the console
        displayResult(error.message, false);
    });
}

/**
 * Updates an existing blog post.
 *
 * Updates an existing post by sending a PUT request to the API with the form data.
 * Displays a success message and reloads the posts after successful update.

 * @param {Event} event - The event object representing the form submission.
 * @param {object} post - The post object containing the post details to be updated.
 */
function updatePost(event, post) {
    // Prevent the default form submission
    event.preventDefault();

    // Retrieve the values from the input fields
    var baseUrl = getAPIBaseUrl();

    // Create a dictionary/object with form values
    const formData = {
        title: document.getElementById('title').value,
        author: document.getElementById('author').value,
        content: document.getElementById('content').value
    };

    // Use the Fetch API to send a PUT request to the /posts endpoint
    fetch(baseUrl + '/posts/' + post.id,  {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
    })

    .then(response => {
        // Check if the response is successful
        if (response.ok) {
            return response.json();  // Parse the JSON data from the response
        } else {
            // Handle different HTTP error status codes
            switch (response.status) {
                case 404:
                    throw new Error('404 Post not found');
                case 500:
                    throw new Error('500 Internal server error');
                default:
                    throw new Error('${response.status} Error updating post');
            }
        }
    })
    .then(post => {
        // Log and display success message after updating the post
        console.log('Post updated:', post);
        var text = "The post '<span style='color: red; font-weight: bold;'>" + post.title + "</span>' has been successfully updated!";
        displayResult(text, true);

        // Reload the posts after updating a post
        loadPosts(pageNumber);
    })
    .catch(error => {
        // Log and display error message if an error occurs
        console.error('Error:', error);
        displayResult(error.message, false);
    });
}

/**
 * Deletes a blog post.
 *
 * Sends a DELETE request to the API to delete a post with the specified ID.
 * Displays a confirmation panel before deletion and shows success/error messages.
 * After successful deletion, reloads the posts to reflect the updated state.
 *
 * @param {number} postId - The ID of the post to be deleted.
 * @param {string} postTitle - The title of the post to be deleted.
 */
function deletePost(postId, postTitle) {
    // Implementation for deleting a post

    // Retrieve the base URL from the input field
    var baseUrl = getAPIBaseUrl();

    // Show a confirmation panel with the post title and wait for the user's response
    showConfirmationPanel(postTitle).then((result) => {
        console.log('Result:', result);
        if (result) {
            // Use the Fetch API to send a DELETE request to the specific post's endpoint
            fetch(baseUrl + '/posts/' + postId, {
                method: 'DELETE'
            })
            .then(response => {
                // Check if the response is successful
                if (response.ok) {
                    console.log('Post deleted:', postId);
                    lastCommand = DELETE_POST_COMMAND;
                    // Display a success message and reload the posts after deleting a post
                    displayResult('Post deleted successfully!', true);
                    loadPosts(pageNumber);
                } else {
                    // If the response is not ok, check different status codes
                    switch (response.status) {
                        case 404:
                            throw new Error('404 The requested post was not found.');
                        case 500:
                            throw new Error('500 Internal server error');
                        default:
                            throw new Error('${response.status} Error deleting post');
                    }
                }
            })
            .catch(error => {
                // Log and display an error message if an error occurs
                console.error('Error:', error);
                displayResult(error.message, false);
            });
        }
    });
}

/**
 * Sends a POST request to the API to like a post.
 * Reloads the posts after successfully liking a post.
 *
 * @param {number} postId - The unique identifier of the post to be liked.
 */
function likePost(postId) {
    // Retrieve the base URL from the input field
    var baseUrl = getAPIBaseUrl();

    // Use the Fetch API to send a POST request to the specific post's endpoint for liking
    fetch(baseUrl + '/like/' + postId, {
        method: 'POST'
    })
    .then(response => {
        // Check if the response is successful
        if (response.ok) {
            console.log('Post Liked:', postId);

            // Reload the posts after liking a post
            loadPosts(pageNumber);
        } else {
            // Log an error message if the response is not ok
            console.error('Error:', response.status, response.statusText);
        }
    })
    .catch(error => {
        // Log and display an error message if an error occurs
        console.error('Error:', error);
    });
}

// -----------------------------------------------------------------------------
// Sorting Functions
// -----------------------------------------------------------------------------
// This section includes functions related to sorting blog posts.
//
/**
 * Sorts and loads blog posts based on user-selected options.
 * This function is triggered when the user selects a sorting option
 * or changes the sorting direction.
 */
function sortBlogPosts() {
    // Calls the loadPosts function to fetch and display the sorted blog posts
    loadPosts(pageNumber);
}

/**
 * Toggles the sorting mode on or off and updates the user interface accordingly.
 * When sorting mode is enabled, the user can select sorting options and change the sort order.
 * When sorting mode is disabled, sorting options are disabled, and the default sort order is applied.
 * After toggling, it triggers the loadPosts function to fetch and display blog posts based on the new sorting options.
 */
function toggleSort() {
    // Toggles the sorting mode flag
    inSortMode = !inSortMode;

    // Retrieves elements related to sorting from the DOM
    const sortMenu = document.getElementById("sortMenu");
    const img = document.getElementById("sortImage");
    const sortOrderBtn = document.getElementById("sortOrderBtn")

    // Updates the UI based on the sorting mode
    if (inSortMode) {
        // Enables sorting options and sort order button
        sortOrderBtn.removeAttribute("disabled")
        sortMenu.removeAttribute("disabled");
        img.src = "../static/images/sorting_on_state.png";
    } else {
        // Disables sorting options and sort order button
        sortOrderBtn.setAttribute("disabled", true);
        sortMenu.setAttribute("disabled", true);
        img.src = "../static/images/sorting_off_state.png"
    }

    // Triggers the loadPosts function to fetch and display posts based on the new sorting options
    loadPosts(pageNumber);
}

/**
 * Toggles the sorting order between ascending and descending.
 * Updates the sort order button icon and reloads the posts with the new order.
 */
function toggleSortOrder() {
    // Check if the current order is ascending
    if (isAscendingOrder) {
        // Set the sort order button HTML to a descending arrow icon
        document.getElementById("sortOrderBtn").innerHTML = '<i class="fa-solid fa-arrow-down-z-a"></i>';
    } else {
        // Set the sort order button HTML to an ascending arrow icon
        document.getElementById("sortOrderBtn").innerHTML = '<i class="fa-solid fa-arrow-down-a-z"></i>';
    }
    // Toggle the sorting order (switch between ascending and descending)
    isAscendingOrder = !isAscendingOrder;

    // Reload posts with the updated sorting order
    loadPosts(pageNumber);
}

// -----------------------------------------------------------------------------
// Search Functions
// -----------------------------------------------------------------------------
//
/**
 * Handles the search functionality when triggered by user input.
 * It checks if the search field contains text, and if so, it initiates a search using the loadPosts function.
 * If the search field is empty, it handles the search accordingly.
 */
function handleSearch() {
    // Retrieves the search input field from the DOM
    var searchField = document.getElementById('search-input');

    // Sets the search mode flag to true
    inSearchMode = true;

    // Calls the searchChange function to update UI elements related to search
    searchChange();

    // Checks if the search field contains text
    if (searchField.value.trim() !== '') {
        // Temporarily stores the current page number and loads the first page
        tempPage = pageNumber;
        loadPosts(1);

        // Outputs a log message indicating that search is triggered with the entered text
        console.log('Search triggered with text:', searchField.value.trim());
    } else {
        // Outputs a log message indicating that the search field is empty
        console.log('Search field is empty');
    }
}

/**
 * Handles the cancellation of the search, resetting the search input field and loading the previous page.
 */
function handleCancelSearch() {
    // Retrieves the search input field from the DOM
    const searchField = document.getElementById('search-input');

    // Resets the search input field
    searchField.value = '';

    // Sets the search mode flag to false
    inSearchMode = false;

    // Calls the searchChange function to update UI elements related to search
    searchChange();

    // Restores the page number to the previous value before the search
    pageNumber = tempPage;

    // Loads posts based on the restored page number
    loadPosts(pageNumber);
}

/**
 * Updates UI elements related to search based on the state of the search input field.
 */
function searchChange() {
    // Retrieves relevant DOM elements related to search
    const searchField = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const searchMenu = document.getElementById('search-menu');
    const exitSearchButton = document.getElementById('exit-search-button');

    // Enables or disables search button and menu based on the presence of text in the search field
    searchButton.disabled = searchField.value.trim() === '';
    searchMenu.disabled = searchButton.disabled;

    // Disables the exit search button if not in search mode, enables it otherwise
    exitSearchButton.disabled = !inSearchMode;
}

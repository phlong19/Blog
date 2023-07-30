const urlParams = new URLSearchParams(window.location.search);

// Check if the sort parameter exists in the query string
const sortParam = urlParams.get('sort');
const searchParam = urlParams.get('search');
const modelParam = urlParams.get('model');

// Get all the pagination links
let paginationLinks = document.querySelectorAll('a[href^="?page="]');
if (sortParam || searchParam) {
  paginationLinks.forEach(function (link) {
    link.href = link.href.replace('?', '&').slice(-7);
  });
}

// Iterate over each pagination link
paginationLinks.forEach(link => {
  // Get the current href attribute
  let href = link.getAttribute('href');

  // Update the href attribute if the sort parameter exists
  if (sortParam) {
    href = `?sort=${sortParam}${href}`;
  }
  if (searchParam && modelParam) {
    href = `?model=${modelParam}&search=${searchParam}${href}`;
  }

  // Set the updated href attribute
  link.setAttribute('href', href);
});

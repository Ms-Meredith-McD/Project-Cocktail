
// GETTING STARTED

// Pull down localStorage data (if it exists)
const projectCocktailData = JSON.parse(localStorage.getItem('projectCocktail')) || {};

// Create new SSOT and populate it will saved favorites
const projectCocktail = {
  favorites: projectCocktailData.favorites || [],
  thisSession: {
    userName: '',
    cocktail: {}
  },
  temp : {
    filteredCocktails: {},
          sortedDrinks: {}
  },
}

// Wait until the DOM is fully loaded before running the code inside
$(document).ready(function () {
    loadIngredients(); // Call the loadIngredients function once the DOM is ready
    $('#mainForm').on('submit', getCocktails);
  });
  
  function loadIngredients() {
    // Make an AJAX request using jQuery
    $.ajax({
      url: "https://www.thecocktaildb.com/api/json/v1/1/list.php?i=list",
      type: "GET", // Specifies the request type as 'GET' to retrieve data
      // Function to handle the response when the request is successful
      success: function (response) {
  
        // Sort the drinks array alphabetically based on the ingredient name.
              // The sort method organizes the elements of an array based on the condition defined in the provided function.
              // In this case the sort method is called on the 'response.drinks' array. 
              // This method sorts the elements of an array based on the provided comparison function.
              // The comparison function takes two parameters (a, b) which represent any two elements from the array that are being compared during the sorting process.
              projectCocktail.temp.sortedDrinks = response.drinks.sort(function (a, b) {
          // 'localeCompare' is a string method that compares two strings (here, ingredient names) and returns a number indicating their relative order.
              // If it returns a negative number, a is sorted before b.
              // If it returns a positive number, a is sorted after b.
              // If it returns zero, a and b are considered equal in sort order.
              // This is repeated for all elements in the array, comparing them in pairs, until the entire array is sorted.
          // This is useful for sorting strings alphabetically in a way that respects the local language's rules (like accents, special characters, etc.).
          return a.strIngredient1.localeCompare(b.strIngredient1);
        });
  
        // Iterate over each drink in the response
        projectCocktail.temp.sortedDrinks.forEach(function (drink) {
          // Append an option element to each of the select elements (ingredient1, ingredient2, ingredient3)
          $("#ingredient1, #ingredient2, #ingredient3").append(
            $("<option>", {
              value: drink.strIngredient1, // Set the value attribute of the option element to the ingredient name
              text: drink.strIngredient1, // Set the visible text of the option element to the ingredient name
            })
          );
        });
      },
      // if request fails log error
      error: function () {
        console.log("Error fetching ingredients");
      },
    });
  }
  
  function getCocktails(e) {
    e.preventDefault();
    // Retrieve values from the input fields and store them in variables
    // jQuerys val() method is used to get the values of form elements.
    var userName = $('#userName').val();
    var ingredient1 = $('#ingredient1').val();
    var ingredient2 = $('#ingredient2').val();
    var ingredient3 = $('#ingredient3').val();

    // Combine the ingredients into an array and filter out any empty values
    var ingredients = [ingredient1, ingredient2, ingredient3].filter(Boolean);

    // Initialize an object to keep track of all cocktails and a counter for the number of completed fetches
    // 'allCocktails' will be used to store information about each cocktail you fetch from the API.
    // Think of 'allCocktails' as a big box where you're going to put each cocktail you find. 
    // Each cocktail will have its own spot in this box, identified by its unique ID (like a name tag). 
    // This way, you can easily find and count how many times each cocktail appears in your search results.
    var allCocktails = {};

    // This line is creating a variable named fetchCount and setting its initial value to 0. This variable will be used as a counter.
    // The purpose of 'fetchCount' is to keep track of how many API requests (fetches) you have completed. 
    // When all these requests are done (up to three) you can then process all the collected data.
    // When the counter shows the same number as the total number of ingredients you asked about, you know you're done collecting data and can move on to the next step.
    var fetchCount = 0;

    // Iterate over each ingredient
    ingredients.forEach(function(ingredient) {
        // Perform an Jquery AJAX request for each ingredient
        $.ajax({
            url: `https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=${ingredient}`,
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                // If data is returned from the API
                if (data.drinks) {
                    // 'data.drinks' will be an array of drink objects, where each object contains information about a specific cocktail.
                    data.drinks.forEach(function(drink) {
                        // Check if the current drink is already in our allCocktails object
                        if (allCocktails[drink.idDrink]) {
                            // If the drink is already in the object, increment its count by 1.
                            // This count helps us track how many ingredients returned this particular drink.
                            allCocktails[drink.idDrink].count++;
                        } else {
                            // If the drink is not in the object, add it with a count of 1.
                            // We use the spread operator(...) to copy all properties of the drink object.
                            // We also add a new property 'count' set to 1, indicating this is the first occurrence of this drink.
                            allCocktails[drink.idDrink] = { ...drink, count: 1 };
                        }
                    });
                }
            },
            error: function() {
                // If there's an error in fetching data, display an error message in the 'searchResults' element
                $('#searchResults').append(`<p>Error fetching cocktail data for ${ingredient}. Please try again.</p>`);
            },
            complete: function() {
                // Increment the fetch counter after each AJAX call is completed
                fetchCount++;
                // If all AJAX calls have been completed
                // This compares the fetchCount (number of completed AJAX requests) to the length of the ingredients array.
                // If the number of completed requests equals the number of ingredients, it means all ingredient data has been fetched.
                if (fetchCount === ingredients.length) {
                     
                    // This line is creating a new array, 'filteredCocktails', containing only the drinks that match a specific criteria.
                    // 'Object.values(allCocktails)' converts the allCocktails object into an array of its values (the cocktail data).
                    // The filter method is used to keep only those drinks that appear in all ingredient results.
                    // It checks if the count property of each drink equals the number of ingredients.
                    projectCocktail.temp.filteredCocktails = Object.values(allCocktails).filter(drink => 
                        
                        // This count property was incremented each time the drink was found in the results of an ingredient.
                        // So, if 'count' equals the length of the ingredients array, it means this drink was found in every ingredient search.
                        drink.count === ingredients.length);
                      
                    // ADD relecant information to the global variable:
                    projectCocktail.thisSession.userName = userName;
                    // Display the filtered cocktails!! (hopefully)
                    displayCocktails(projectCocktail.temp.filteredCocktails, userName);
                }
            }
        });
    });
}
// Function to display the cocktails
function displayCocktails(cocktails, userName) {
  

    // initialize a variable to hold the HTML content
    var htmlContent = '';
    // Check if there are no cocktails
    if (cocktails.length === 0) {
        // Display a message to the user if no cocktails are found
        htmlContent = '<p>No cocktails found that match the selected ingredients.</p>';

    // Iterate over each cocktail and build the HTML content
    } else {
        cocktails.forEach(function(drink) {
            var { strDrink, idDrink, strDrinkThumb } = drink;
            htmlContent += `
                <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                    <div class="card">
                        <img src="${strDrinkThumb}" class="card-img-top" alt="${strDrink}">
                        <div class="card-body">
                            <h5 class="card-title">${strDrink}</h5>
                            <button value="${idDrink}" class="drinkButton btn btn-warning">Select this drink</button>
                        </div>
                    </div>
                </div>`;
        });
    }
// Set the inner HTML of the 'searchResults' element and attach a click event listener to buttons with class 'drinkButton'
    $('#searchResults').html(htmlContent).on('click', '.drinkButton', function() {
      $('#ingredient1').val('');
      $('#ingredient2').val('');
      $('#ingredient3').val('');
      $('#userName').val('');
      $('#searchResults').html('')
        projectCocktail.thisSession.cocktail.idDrink = this.value;

        // Delete the arrays of data we used to create the UI on this page,
        // Then save the updated projectCoctail to local storage
        // At this point, the SSOT consists of 1) a list of favorites; 2) a 'thisSession' object with the userName, and 3) a nested object 'cocktail' containing the id number of the selected cocktail. This will be passed into an API call on the next page
        projectCocktail.temp = {
          filteredCocktails: {},
          sortedDrinks: {}
        };
        localStorage.setItem('projectCocktail', JSON.stringify(projectCocktail));
        window.open(`./final.html`);
    });
}

window.addEventListener('focus', function() {
  // Reload the page when the window gains focus
  location.reload();
});
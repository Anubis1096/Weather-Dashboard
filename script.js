const searchBar = $("#search-bar");
const searchButton = $("#search-btn");
const searchHistory = $("#search-history");
const weatherCol = $("#weather-col");

const apiKey = "a667aedb14a5387a5d5f81ce6591ec9f";
let currentWeatherUrl;
let forecastUrl;
let storedSearches = [];

//Retrieves stored searches from local storage
let tempStoredSearches = localStorage.getItem("storedSearches");
if (tempStoredSearches != null)
    storedSearches = tempStoredSearches.split(",");

//Creates current date variable
let today = new Date();
let currentDate = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

//Builds current weather conditions
function populateCurrentWeather() {

    $.ajax({
        url: currentWeatherUrl,
        method: "GET"
    }).then(function (response) {

        //Object to store current weather data
        let currentWeatherObj = {
            location: response.name,
            date: currentDate,
            weatherIcon: response.weather[0].icon,
            temperature: Math.round(response.main.temp),
            humidity: response.main.humidity,
            wind: response.wind.speed,
            uvIndex: 0,
            uvIntensity: ""
        };

        //Format the date for the object 
        currentWeatherObj.date = formatDates(currentWeatherObj.date);

        //UV index 
        let latitude = response.coord.lat;
        let longitude = response.coord.lon;
        let currentUvUrl = "https://api.openweathermap.org/data/2.5/uvi?lat=" + latitude + "&lon=" + longitude + "&appid=" + apiKey;

        $.ajax({
            url: currentUvUrl,
            method: "GET"
        }).then(function (response2) {

            currentWeatherObj.uvIndex = response2.value;

            //Updates color-coding for UV intensity
                if (currentWeatherObj.uvIndex < 3) {
                    currentWeatherObj.uvIntensity = "p-1 rounded bg-success text-white";
                  } else if (currentWeatherObj.uvIndex < 8) {
                    currentWeatherObj.uvIntensity = "p-1 rounded bg-warning text-white";
                  } else {
                    currentWeatherObj.uvIntensity = "p-1 rounded bg-danger text-white";
                  }    

            //Generates a card with all current weather info and appends it to the weather-col element
            let currentWeatherCard = $('<div class="card"><div class="card-body"><h5 class="card-title">' + currentWeatherObj.location + ' (' + currentWeatherObj.date + ') ' +
                '<span class="badge badge-primary"><img id="weather-icon" src="http://openweathermap.org/img/wn/' + currentWeatherObj.weatherIcon + '@2x.png"></span></h5>' +
                '<p class="card-text">Temperature: ' + currentWeatherObj.temperature + ' °F</p>' +
                '<p class="card-text">Humidity: ' + currentWeatherObj.humidity + '%</p>' +
                '<p class="card-text">Wind Speed: ' + currentWeatherObj.wind + ' MPH</p>' +
                '<p class="card-text">UV Index: <span class="badge badge-secondary ' + currentWeatherObj.uvIntensity + '">' + currentWeatherObj.uvIndex + '</span>')
            $("#weather-col").append(currentWeatherCard);
        });

        renderStoredSearches();
    });
}

function populateWeatherForecast() {

    const fiveDayForecastArray = [];

    //Five day forecast
    $.ajax({
        url: forecastUrl,
        method: "GET"
    }).then(function (response) {

        console.log(response);

        let temporaryForecastObj;

        for (let i = 4; i < response.list.length; i += 8) {
            temporaryForecastObj = {
                date: response.list[i].dt_txt.split(" ")[0],
                weatherIcon: response.list[i].weather[0].icon,
                temperature: Math.round(response.list[i].main.temp),
                humidity: response.list[i].main.humidity
            };
            fiveDayForecastArray.push(temporaryForecastObj);
        }

        //Formats dates for objects in array
        for (let i = 0; i < fiveDayForecastArray.length; i++) {
            fiveDayForecastArray[i].date = formatDates(fiveDayForecastArray[i].date);
        }

        //Creates HTML for forecast
        const forecastHeader = $('<h5>5-Day Forecast:</h5>');
        $("#forecast-header").append(forecastHeader);

        for (let i = 0; i < fiveDayForecastArray.length; i++) {
            let forecastCard = $('<div class="col-lg-2 col-sm-3 mb-1"><span class="badge badge-primary"><h5>' + fiveDayForecastArray[i].date + '</h5>' +
                '<p><img class="w-100" src="http://openweathermap.org/img/wn/' + fiveDayForecastArray[i].weatherIcon + '@2x.png"></p>' +
                '<p>Temp: ' + fiveDayForecastArray[i].temperature + '°F</p>' +
                '<p>Humidity: ' + fiveDayForecastArray[i].humidity + '%</p>' +
                '<span></div>');
            $("#forecast-row").append(forecastCard);
        }
    });
}

function renderStoredSearches() {

    $("#search-history").empty();

    //If the search bar value is not empty, adds the value to the front of the storedSearches array
    //Also checks if the value is a duplicate value and repositions the value to the front of the array if it is
    if ($("#search-bar").val() != "") {
        if (storedSearches.indexOf($("#search-bar").val()) != -1) {
            storedSearches.splice(storedSearches.indexOf($("#search-bar").val()), 1)
        }
        storedSearches.unshift($("#search-bar").val());
    }

    //Saves storedSearches to local storage
    localStorage.setItem("storedSearches", storedSearches);

    //Creates search history list items to show under the search bar
    for (var i = 0; i < storedSearches.length; i++) {
        var newListItem = $('<li class="list-group-item">' + storedSearches[i] + '</li>');
        $("#search-history").append(newListItem);
    }

    //Allows user to search for list items they click on
    $("li").on("click", function () {
        $("#search-bar").val($(event.target).text());
        searchButton.click();
    });
}

//Formats date to month/day/year
function formatDates(data) {
    let dateArray = data.split("-");
    let formattedDate = dateArray[1] + "/" + dateArray[2] + "/" + dateArray[0];
    return formattedDate
}

searchButton.on("click", function () {

    currentWeatherUrl = "https://api.openweathermap.org/data/2.5/weather?q=" + searchBar.val() + "&units=imperial&appid=" + apiKey;

    forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?q=" + searchBar.val() + "&units=imperial&appid=" + apiKey;

    $("#weather-col").empty();
    $("#forecast-header").empty();
    $("#forecast-row").empty();

    populateCurrentWeather();
    populateWeatherForecast();
});

//Alows user to press enter in the search bar rather than have to press the search button
$("#search-bar").keypress(function () {
    if (event.keyCode == 13)
        searchButton.click();
});


renderStoredSearches();
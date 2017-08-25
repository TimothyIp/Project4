var app = {};
app.baseUrl = "https://api.teleport.org/api";
app.googleApiKey = "AIzaSyC2rp3eThm2aecP1jO5Ok4QpkYK_aJTuV4";
app.weatherApiKey = "36dcbd995ae016fd693d2850b085e655";


//Code from stackoverflow for the autocomplete location inputs

// function initMap() {
//   var input = document.getElementById('pac-input');
//   var options = {
//   	types: ["(cities)"]
//   }

//  var autocomplete = new google.maps.places.Autocomplete(input,options);

// }
app.events = function(){
	//Auto Complete Bar courtesy of Teleport.
	TeleportAutocomplete.init('.my-input').on('change', function(value) {
		// console.log(value);

		var basicCityInfo = value
		console.log(basicCityInfo);
		if (value.uaSlug) {
			var slugId = value.uaSlug;
			app.urbanAreaInfo(slugId, basicCityInfo);
		} else {
			let err = "There is no startup information in this city.";
			app.displayData(null,err);
		}
	});


	$("form").on('submit', function(e){
		e.preventDefault();
	})
}
app.urbanAreaInfo = function (slug, basicCityInfo) {

	var urbanUrl = app.baseUrl + "/urban_areas/" + "slug:" + slug +"/";

	$.ajax({
		type: "GET",
		dataType: "json",
		url: urbanUrl
	}).then(function(res) {
		console.log(res);
		let imageUrl = res._links["ua:images"].href;
		let scoresUrl = res._links["ua:scores"].href;
		let detailsUrl = res._links["ua:details"].href;
		app.parseData(basicCityInfo, imageUrl, scoresUrl, detailsUrl);
	})
}

app.parseData = function( basicCityInfo , imageUrl, scoresUrl, detailsUrl) {

	let weatherUrl = "http://api.openweathermap.org/data/2.5/weather?"

	let call1 = $.ajax({
		type: "GET",
		dataType: "json",
		url: imageUrl
	});

	let call2 = $.ajax({
		type: "GET",
		dataType: "json",
		url: scoresUrl
	});

	let call3 = $.ajax({
		type: "GET",
		dataType: "json",
		url: detailsUrl
	});

	let call4 = $.ajax({
		type: "GET",
		dataType: "json",
		url: weatherUrl,
		data: {
			q:basicCityInfo.name,
			units: "metric",
			appid: app.weatherApiKey
		}
	})

	$.when(call1, call2, call3, call4).done(function(res1, res2, res3, res4){
		var images = res1[0].photos[0].image.web;
		var summary = res2[0].summary;
		var details = res3[0];
		console.log(details);
		console.log(res4[0]);
		var avgTemp = res4[0].main.temp;
		var weatherDescription = res4[0].weather[0].description;
		var iconTemp = "http://openweathermap.org/img/w/" + res4[0].weather[0].icon + ".png";

		//Checks array values and injects content in if there is none
		function noDataFiller(array, index, id) {
			if( index === -1 ) {
				let a = {id: id, 
						int_value: 0,
						string_value: "There is no data."
						}
				array.push(a);
				return array[array.length - 1];
			} else {
				return array[index];
			}
		}

		let startupIndex = details.categories.findIndex(function(el) {
			return el.id === "STARTUPS";
		});
		let startupInfo = details.categories[startupIndex].data

		let startupNumIndex = startupInfo.findIndex(function(el) {
			return el.id === "FUNDERBEAM-TOTAL-STARTUPS";
		});

		let startupNum = noDataFiller(startupInfo, startupNumIndex, "FUNDERBEAM-TOTAL_STARTUPS").int_value;

		let startupNumIndex2 = startupInfo.findIndex(function(el) {
			return el.id === "STARTUP-CLIMATE-NEW-STARTUPS";
		});

		let startupMonthlyDif = noDataFiller(startupInfo, startupNumIndex2,"STARTUP-CLIMATE-NEW-STARTUPS").int_value;

		let startupNumIndex3 = startupInfo.findIndex(function(el) {
			return el.id === "STARTUP-CLIMATE-INVESTORS";
		});

		let startupMonthlyInvestors = noDataFiller(startupInfo, startupNumIndex3, "STARTUP-CLIMATE-INVESTORS").int_value;

		let startupNumIndex4 = startupInfo.findIndex(function(el) {
			return el.id === "EVENTS-LAST-12-MONTHS";
		});

		let startupEvents = noDataFiller(startupInfo, startupNumIndex4, "EVENTS-LAST-12-MONTHS").int_value;

		//------------------------------------------------------------------------------------------------------------------

		let ventureIndex = details.categories.findIndex(function(el) {
			return el.id === "VENTURE-CAPITAL";
		});
		let ventureInfo = details.categories[ventureIndex].data;

		let ventureNumIndex = ventureInfo.findIndex(function(el) {
			return el.id === "FUNDING-ACCELERATOR-NAMES";
		});

		let ventureAccelNames = noDataFiller( ventureInfo, ventureNumIndex, "FUNDING-ACCELERATOR-NAMES").string_value;

		let ventureNumIndex2 = ventureInfo.findIndex(function(el) {
			return el.id === "FUNDING-ACCELERATORS-DETAIL";
		});

		let ventureAccelDetails = noDataFiller( ventureInfo, ventureNumIndex2, "FUNDING-ACCELERATORS-DETAIL").int_value;

		//information from different ajax calls are sent to the view function
		let results = {
			basicCityInfo: basicCityInfo,
			summary: summary,
			images: images,
			details: details,
			startupInfo: startupInfo,
			startupNum: startupNum,
			startupMonthlyDif: startupMonthlyDif,
			startupMonthlyInvestors: startupMonthlyInvestors,
			startupEvents: startupEvents,
			ventureAccelNames: ventureAccelNames,
			ventureAccelDetails: ventureAccelDetails,
			avgTemp: avgTemp,
			iconTemp: iconTemp,
			weatherDescription: weatherDescription
		}
		app.displayData(results)
	})
}




app.displayData = function(results, err) {
	console.log(results);
	// console.log(err);
	$(".no__info").empty();
	$(".show__info").empty();
	$(".details__info").empty();
	//Grabs index with Id of STARTUPS
	if (results) {

		let title = $("<h3>").addClass("city__title").text(results.basicCityInfo.title);
		let description = $("<div>").addClass("city__description").html(results.summary);
		let cityImage = $("<img>").addClass("city__image").attr('src', results.images)

		let container = $("<div>").addClass("city__container").append(cityImage, title, description);

		let population = $("<h3>").addClass("population__detail").text("Population:" +  results.basicCityInfo.population);

		let startupNumbers = $("<p>").addClass("startup__numbers").append(`Startups in ${results.basicCityInfo.name}: ${results.startupNum}`);

		let startupChanges = $("<p>").addClass("startup__changes").append(`Average monthly increase in number of startups: ${results.startupMonthlyDif}`);

		let investorNum = $("<p>").addClass("start__investors").append(`Number of Investors: ${results.startupMonthlyInvestors}`);

		let startupEvents = $("<p>").addClass("startup__events").append(`Number of startup events in the last 12 months: ${results.startupEvents}`);

		let acceleratorNames = $("<p>").addClass("accelerator__names").append(`These are some of the funding accelerators in <strong>${results.basicCityInfo.name}:</strong> ${results.ventureAccelNames}`);

		let acceleratorNum = $("<p>").addClass("accelerator__num").append(`Number of funding accelerators: ${results.ventureAccelDetails}`)

		$(".show__info").append(container);
		$(".details__info").append(population,startupNumbers, startupChanges, investorNum, startupEvents, acceleratorNames, acceleratorNum);

		let weatherIcon = $("<img>").addClass("weather__icon").attr('src',results.iconTemp);
		let weatherDescription = $("<p>").addClass("weather__description").append(`Current weather condition: ${results.weatherDescription}`)

		let weatherTemp = $("<p>").addClass("weather__temp").append(`Current: ${results.avgTemp}&#8451;`);



		$(".weather__container").empty();
		$(".weather__container").append(weatherIcon, weatherDescription, weatherTemp);


		$(".city__description p:last").remove();
	} else {
		$(".no__info").append(err);
	}
}



app.init = function () {
	app.events();
}

$(function() {
	app.init();

})

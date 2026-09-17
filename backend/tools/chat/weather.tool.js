import {env} from "../../config/env.js";

export async function currentWeather({city}) {
    console.log("Weather tool called");

    const url = new URL(
        "https://api.weatherapi.com/v1/current.json"
    ); 

    url.searchParams.set("key", env.weatherApiKey);
    url.searchParams.set("q", city);

    const response = await fetch(url);

    if(!response.ok) {
        throw new Error(`Weather API request failed with status ${response.status}`);
    }

    return await response.json();
}
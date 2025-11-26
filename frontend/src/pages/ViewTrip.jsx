import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import axios from "axios";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { useAuth } from "../context/authContext";


// Custom hook to load Google Maps
const useLoadGoogleMaps = (apiKey) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setLoaded(true);
      document.head.appendChild(script);
    } else {
      setLoaded(true);
    }
  }, [apiKey]);

  return loaded;
};


// Day Colors
const dayColors = [
  "#FF5252",
  "#4285F4",
  "#0F9D58",
  "#FF9800",
  "#9C27B0",
  "#00BCD4",
];


const ViewTrip = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tripId } = useParams();
  const { user } = useAuth();

  const [recommendations, setRecommendations] = useState(null);
  const [tripDetails, setTripDetails] = useState(null);
  const [error, setError] = useState(null);

  const [activeMarker, setActiveMarker] = useState(null);
  const [map, setMap] = useState(null);

  const [destinationImage, setDestinationImage] = useState("");
  const [placeImages, setPlaceImages] = useState({});
  const [savedPlaces, setSavedPlaces] = useState([]);

  const [loading, setLoading] = useState({
    destinationImage: true,
    placeImages: true,
  });

  // API KEYS
  const unsplashAccessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const isGoogleMapsLoaded = useLoadGoogleMaps(googleMapsApiKey);


  // ---------- FETCH SAVED PLACES ----------
  const fetchSavedPlaces = async () => {
    if (!user) return;
    try {
      const response = await axios.get(
        "http://localhost:5555/users/savedplaces",
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setSavedPlaces(response.data.savedPlaces || []);
    } catch (error) {
      console.error("Error fetching saved places:", error);
    }
  };


  // ---------- SAVE / UNSAVE PLACE ----------
  const handleSavePlace = async (place) => {
    if (!user) {
      alert("Please login to save places!");
      return;
    }

    try {
      const isAlreadySaved = savedPlaces.some(p => p.name === place.name);

      if (isAlreadySaved) {
        const savedPlace = savedPlaces.find(p => p.name === place.name);

        await axios.delete(
          `http://localhost:5555/users/saveplace/${savedPlace._id}`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );

        setSavedPlaces(savedPlaces.filter(p => p._id !== savedPlace._id));
      } else {
        const response = await axios.post(
          "http://localhost:5555/users/saveplace",
          {
            name: place.name,
            lat: place.lat,
            lng: place.lng,
            rating: place.rating || 0,
            address: place.address,
            types: place.types || []
          },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );

        setSavedPlaces([...savedPlaces, response.data.place]);
      }
    } catch (error) {
      console.error("Error saving place:", error);
    }
  };


  // ---------- FETCH DESTINATION IMAGE ----------
  const fetchDestinationImage = async (destination) => {
    try {
      setLoading(prev => ({ ...prev, destinationImage: true }));

      const response = await axios.get(
        `https://api.unsplash.com/photos/random`,
        {
          params: {
            query: `${destination} city`,
            orientation: "landscape",
            client_id: unsplashAccessKey,
          },
        }
      );

      setDestinationImage(response.data.urls.regular);
    } catch (error) {
      setDestinationImage(`https://source.unsplash.com/1600x900/?travel,${destination}`);
    } finally {
      setLoading(prev => ({ ...prev, destinationImage: false }));
    }
  };


  // ---------- FETCH PLACE IMAGES ----------
  const fetchPlaceImages = async () => {
    const images = {};
    try {
      setLoading(prev => ({ ...prev, placeImages: true }));

      for (const dayPlan of recommendations) {
        for (const place of dayPlan.places) {
          try {
            const response = await axios.get("https://api.unsplash.com/photos/random", {
              params: {
                query: `${place.name} ${tripDetails.destination}`,
                client_id: unsplashAccessKey,
              },
            });

            images[place.name] = response.data.urls.small;
          } catch {
            images[place.name] = `https://source.unsplash.com/200x200/?landmark`;
          }
        }
      }
    } finally {
      setPlaceImages(images);
      setLoading(prev => ({ ...prev, placeImages: false }));
    }
  };


  // ---------- FETCH TRIP BY ID ----------
  const fetchTripById = async (id) => {
    try {
      const response = await axios.get(
        `http://localhost:5555/users/mytrip/${id}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      const trip = response.data.trip;

      // Set the trip data in the same format as location.state
      setRecommendations(trip.itinerary);
      setTripDetails({
        destination: trip.destination,
        budget: trip.budget,
        interests: trip.preferences || []
      });
      fetchDestinationImage(trip.destination);
      fetchSavedPlaces();
    } catch (error) {
      console.error("Error fetching trip:", error);
      setError("Failed to load trip. Please try again.");
    }
  };


  // ---------- USE EFFECTS ----------
  useEffect(() => {
    // If trip data is passed via location.state (from CreateTrip)
    if (location.state) {
      setRecommendations(location.state.itinerary);
      setTripDetails(location.state.tripDetails);
      fetchDestinationImage(location.state.tripDetails.destination);
      fetchSavedPlaces();
    }
    // If tripId is in URL params (from MyTrips)
    else if (tripId && user) {
      fetchTripById(tripId);
    }
    // No data available
    else if (!tripId) {
      setError("No trip data found. Please generate a new trip.");
    }
  }, [location.state, tripId, user]);

  useEffect(() => {
    if (recommendations && tripDetails) {
      fetchPlaceImages();
    }
  }, [recommendations, tripDetails]);


  // ---------- MAP HELPERS ----------
  const handleMarkerClick = (marker) => setActiveMarker(marker);
  const handleMapLoad = (map) => setMap(map);

  const handleDayClick = (dayNumber) => {
    const dayPlaces = allPlaces.filter(p => p.day === dayNumber);
    if (!map || dayPlaces.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    dayPlaces.forEach(p => bounds.extend(new window.google.maps.LatLng(p.lat, p.lng)));

    map.fitBounds(bounds);
    if (map.getZoom() > 15) map.setZoom(15);
  };

  const openGoogleMaps = (lat, lng) =>
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");



  // ---------- ERROR / LOADING UI ----------
  if (error) {
    return (
      <div>
        <Navbar />
        <p className="text-center mt-10 text-red-500">{error}</p>
        <button
          className="block mx-auto mt-4 bg-blue-900 text-white px-4 py-2 rounded-lg"
          onClick={() => navigate("/create-trip")}
        >
          Create New Trip
        </button>
      </div>
    );
  }

  if (!recommendations || !tripDetails) {
    return (
      <div>
        <Navbar />
        <p className="text-center mt-10">Loading itinerary...</p>
      </div>
    );
  }


  // ---------- MERGE PLACES ----------
  const allPlaces = recommendations.flatMap((dayPlan) =>
    dayPlan.places.map((place) => ({ ...place, day: dayPlan.day }))
  );

  const mapCenter = allPlaces.length
    ? { lat: allPlaces[0].lat, lng: allPlaces[0].lng }
    : { lat: 0, lng: 0 };


  // ---------------- RETURN UI ----------------
  return (
    <div className="flex flex-col h-screen">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">

        {/* LIST PANEL */}
        <div className="w-full lg:w-1/2 overflow-y-auto">

          {/* Destination Header */}
          <div className="relative h-64 w-full">
            {loading.destinationImage ? (
              <div className="w-full h-full bg-gray-200 animate-pulse"></div>
            ) : (
              <img
                src={destinationImage}
                alt={tripDetails.destination}
                className="w-full h-full object-cover"
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <h1 className="text-4xl font-bold text-white">
                {tripDetails.destination}
              </h1>
            </div>
          </div>


          {/* Trip Summary */}
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-2xl font-semibold mb-4 text-blue-800">Trip Summary</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Destination</p>
                  <p className="text-lg font-medium">{tripDetails.destination}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Budget</p>
                  <p className="text-lg font-medium">{tripDetails.budget}</p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Interests</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {tripDetails.interests.map((i, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full"
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>


            {/* DAILY PLAN */}
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Daily Plan</h2>

            {recommendations.map((dayPlan, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">

                <div
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => handleDayClick(dayPlan.day)}
                  style={{ backgroundColor: `${dayColors[(dayPlan.day - 1) % dayColors.length]}20` }}
                >
                  <div className="flex items-center">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white mr-3 font-bold"
                      style={{ backgroundColor: dayColors[(dayPlan.day - 1) % dayColors.length] }}
                    >
                      {dayPlan.day}
                    </span>

                    <h3 className="text-xl font-semibold">Day {dayPlan.day}</h3>
                  </div>

                  <button className="text-sm bg-white text-gray-700 px-3 py-1 rounded-lg">
                    View on Map
                  </button>
                </div>


                <div className="p-4 space-y-4">
                  {dayPlan.places.map((place, idx) => (
                    <div key={idx} className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">

                      {/* IMAGE */}
                      <div className="relative w-16 h-16 flex-shrink-0">
                        {placeImages[place.name] ? (
                          <img
                            src={placeImages[place.name]}
                            alt={place.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 animate-pulse rounded-lg"></div>
                        )}

                        <span
                          className="absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: dayColors[(dayPlan.day - 1) % dayColors.length] }}
                        >
                          {dayPlan.day}
                        </span>
                      </div>


                      {/* DETAILS */}
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">

                          {/* Name */}
                          <h4 className="font-bold text-gray-800">{place.name}</h4>

                          {/* SAVE + MAP BUTTONS */}
                          <div className="flex gap-2">

                            {/* SAVE BUTTON */}
                            <button
                              onClick={() => handleSavePlace(place)}
                              className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded flex items-center gap-1"
                            >
                              {savedPlaces.some(p => p.name === place.name) ? (
                                <>
                                  <FaBookmark size={12} /> Saved
                                </>
                              ) : (
                                <>
                                  <FaRegBookmark size={12} /> Save
                                </>
                              )}
                            </button>

                            {/* MAP BUTTON */}
                            <button
                              onClick={() => openGoogleMaps(place.lat, place.lng)}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                            >
                              Map
                            </button>

                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mt-1">{place.address}</p>

                        {place.rating && (
                          <div className="flex items-center mt-1">
                            <span className="text-yellow-500">⭐</span>
                            <span className="text-sm ml-1">{place.rating}</span>
                          </div>
                        )}
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            ))}

            <button
              className="w-full bg-blue-900 text-white font-medium py-3 px-4 rounded-lg mt-6"
              onClick={() => navigate("/")}
            >
              Back to Home
            </button>

          </div>
        </div>


        {/* MAP PANEL */}
        <div className="hidden lg:block lg:w-1/2 sticky top-0 h-screen">
          {isGoogleMapsLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={mapCenter}
              zoom={12}
              onLoad={handleMapLoad}
              options={{
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
              }}
            >
              {allPlaces.map((place, idx) => (
                <Marker
                  key={idx}
                  position={{ lat: place.lat, lng: place.lng }}
                  onClick={() => handleMarkerClick(place)}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: dayColors[(place.day - 1) % dayColors.length],
                    fillOpacity: 1,
                    strokeColor: "#fff",
                    strokeWeight: 2,
                  }}
                />
              ))}

              {activeMarker && (
                <InfoWindow
                  position={{ lat: activeMarker.lat, lng: activeMarker.lng }}
                  onCloseClick={() => setActiveMarker(null)}
                >
                  <div>
                    <h4 className="font-bold">{activeMarker.name}</h4>
                    <p className="text-sm text-gray-600">Day {activeMarker.day}</p>
                    <button
                      onClick={() => openGoogleMaps(activeMarker.lat, activeMarker.lng)}
                      className="mt-2 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded"
                    >
                      Open in Maps
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              Loading Map...
            </div>
          )}
        </div>

      </div >
    </div >
  );
};

export default ViewTrip;

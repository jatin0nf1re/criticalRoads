import { Injectable } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from "../environments/environment";

@Injectable({
  providedIn: 'root'
})

export class MapService {
  map: mapboxgl.Map;
  style = 'mapbox://styles/mapbox/streets-v11';
  lat = 23.043721;
  lng = 78.427236;
  zoom = 12;
  bbox = '';

  URL = "https://overpass-api.de/api/interpreter";

  constructor(private http : HttpClient) {
    Object.getOwnPropertyDescriptor(mapboxgl, "accessToken").set(environment.mapbox.accessToken);
  }

  buildMap() {
    
    this.map = new mapboxgl.Map({
      container: 'map',
      style: this.style,
      zoom: this.zoom,
      center: [this.lng, this.lat]
    })
  }

  getData(): Observable<any>{
    let ne = this.map.getBounds().getNorthEast();
    let sw = this.map.getBounds().getSouthWest();
    this.bbox = '(' + sw.lat + ',' + sw.lng + ',' + ne.lat + ',' + ne.lng + ')';
    console.log(this.bbox);
    //console.log(this.http.get(this.URL + '?data=[out:json][timeout:25];(node["highway"]' + this.bbox + ';way["highway"]' + this.bbox + ';relation["highway"]' + this.bbox + ';);out body;>;out skel qt;'));
    return this.http.get(this.URL + '?data=[out:json][timeout:25];(node["highway"]' + this.bbox + ';way["highway"]' + this.bbox + ';relation["highway"]' + this.bbox + ';);out body;>;out skel qt;');
  }
}


// https://overpass-api.de/api/interpreter?
// data=[out:popup("Public Transport Stops";[name][highway~"bus_stop|tram_stop"];[name][railway~"halt|station|tram_stop"];"name";)];(node(50.75,7.1,50.77,7.13);<;);out;

// https://overpass-api.de/api/interpreter?data=[out:json][timeout:25];(node["highway"](28.62987463636641,77.21680641174315,28.63630628871017,77.22299695014954);way["highway"](28.62987463636641,77.21680641174315,28.63630628871017,77.22299695014954);relation["highway"](28.62987463636641,77.21680641174315,28.63630628871017,77.22299695014954););out body;>;out skel qt;
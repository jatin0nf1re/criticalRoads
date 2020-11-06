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
  lat = 28.631129;
  lng = 77.217753;
  
  zoom = 14;
  bbox = '';

  mapping = new Map();
  totNodes = 0;
  cred = new Map<number, Object>();
  visited = new Map<number, boolean>();
  disc = new Map<number, number>();
  low = new Map<number, number>();
  parent = new Map<number, number>();
  time : number;
  criticalRoads = new Map();

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

  createNodeMapping(data):any{
    let totalNodes = 0;
    this.mapping.clear();
    this.cred.clear();
    for(let i=0; i<data.elements.length; i++){
      if(data.elements[i].type == 'node'){
        this.mapping.set(data.elements[i].id, {'location' :[ data.elements[i].lon, data.elements[i].lat], 'conNodes': []} );
        this.cred.set(data.elements[i].id, {'visited' : false, 'parent': null, 'disc': 0, 'low': 0});
        this.visited.set(data.elements[i].id, false);
        this.parent.set(data.elements[i].id, null);
        this.disc.set(data.elements[i].id, 0);
        this.low.set(data.elements[i].id, 0);
        totalNodes++;

      }
    }
    this.totNodes = totalNodes;
    let totalRoads = this.mapRoads(data);
    console.log(this.mapping);
    return [totalNodes, totalRoads];
  }

  mapRoads(data):number{
    let totalRoads = 0;
    for(let i=0; i<data.elements.length; i++){
      if(data.elements[i].type == 'way'){
        totalRoads++;
        let arr = [];
        for(let j=0; j<data.elements[i].nodes.length; j++){
          arr.push(this.mapping.get(data.elements[i].nodes[j]).location);
          if(j>0){
            this.mapping.get(data.elements[i].nodes[j]).conNodes.push(data.elements[i].nodes[j-1]);
            this.mapping.get(data.elements[i].nodes[j-1]).conNodes.push(data.elements[i].nodes[j]);
          }
        }
        
        this.map.addSource(data.elements[i].id.toString(), {
          'type': 'geojson',
          'data': {
          'type': 'Feature',
          'properties': {},
          'geometry': {
            'type': 'LineString',
            'coordinates': arr,
          }
          }
        });
        this.map.addLayer({
          'id': data.elements[i].id.toString(),
          'type': 'line',
          'source': data.elements[i].id.toString(),
          'layout': {
          'line-join': 'round',
          'line-cap': 'round'
          },
          'paint': {
          'line-color': '#3f51b5',
          'line-width': 4,
          'line-opacity': 0.6,
          }
          });

      }
    }
    return totalRoads;
  }

  removeAllLayers(data){
    if(data){
      data.elements.forEach(element => {
        if(element.type=='way'){
          this.map.removeLayer(element.id.toString());
          this.map.removeSource(element.id.toString());
        }
      });
    }
  }

  cutEdgesUtil(key:number){
    this.visited.set(key, true);
    this.time += 1;
    this.disc.set(key, this.time);
    this.low.set(key, this.time);

    this.mapping.get(key).conNodes.forEach(element => {
      if(this.visited.get(element)==false){
        this.parent.set(element, key);
        this.cutEdgesUtil(element);
        this.low.set(key, Math.min(this.low.get(element), this.low.get(key)));

        if(this.low.get(element) > this.disc.get(key)){
          let temp = [];
          temp.push(this.mapping.get(key).location);
          temp.push(this.mapping.get(element).location);
          this.criticalRoads.set( key.toString()+element.toString() , temp);
        }
      }else if(element != this.parent.get(key)){
        this.low.set(key, Math.min(this.low.get(key), this.disc.get(element)));
      }
    });
    
  }

  findCriticalRoads(){
    this.time = 0;
    console.log(this.mapping);
    console.log("Hey");
    this.visited.forEach((value, key) => {
      if(value== false){
        this.cutEdgesUtil(key);
      }
    })

    this.drawCutEdges();
  }

  drawCutEdges(){
    this.criticalRoads.forEach((value,key) => {

      this.map.addSource(key, {
        'type': 'geojson',
        'data': {
        'type': 'Feature',
        'properties': {},
        'geometry': {
          'type': 'LineString',
          'coordinates': value,
        }
        }
      });
      this.map.addLayer({
        'id': key,
        'type': 'line',
        'source': key,
        'layout': {
        'line-join': 'round',
        'line-cap': 'round'
        },
        'paint': {
        'line-color': '#ec407f',
        'line-width': 4,
        'line-opacity': 0.6,
        }
        });

    })
  }
}


// https://overpass-api.de/api/interpreter?
// data=[out:popup("Public Transport Stops";[name][highway~"bus_stop|tram_stop"];[name][railway~"halt|station|tram_stop"];"name";)];(node(50.75,7.1,50.77,7.13);<;);out;

// https://overpass-api.de/api/interpreter?data=[out:json][timeout:25];(node["highway"](28.62987463636641,77.21680641174315,28.63630628871017,77.22299695014954);way["highway"](28.62987463636641,77.21680641174315,28.63630628871017,77.22299695014954);relation["highway"](28.62987463636641,77.21680641174315,28.63630628871017,77.22299695014954););out body;>;out skel qt;
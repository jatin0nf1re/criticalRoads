import { Component, OnInit } from '@angular/core';
import { MapService } from '../map.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  constructor(private map : MapService) { }

  ngOnInit(): void {
  }

  areaData;
  totalNodes=0;
  totalRoads=0;
  totalElements=0;


  onButtonClick(){
    this.map.removeAllLayers(this.areaData);
    this.map.getData().subscribe(data => {
      console.log(data);
      this.areaData = data;
      this.totalElements = this.areaData.elements.length;
      let totals = this.map.createNodeMapping(this.areaData);
      this.totalNodes = totals[0];
      this.totalRoads = totals[1];
      //this.map.mapRoads(this.areaData);
    });
  }

  findCriticalRoads(){
    this.map.removeAllLayers(this.areaData);
    this.map.findCriticalRoads();
  }

}

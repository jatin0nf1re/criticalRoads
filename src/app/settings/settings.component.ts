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

  onButtonClick(){
    this.map.getData().subscribe(data => {
      console.log(data);
    });
  }

}

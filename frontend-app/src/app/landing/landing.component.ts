import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import * as AOS from 'aos';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {
  
  ngOnInit(): void {
    // Initialize Animate On Scroll
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-in-out'
    });
  }
}

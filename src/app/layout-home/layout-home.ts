import { Component } from '@angular/core';
import { NavBar } from "../nav-bar/nav-bar";
import { Devoluciones } from "../devoluciones/devoluciones";

@Component({
  selector: 'app-layout-home',
  imports: [NavBar, Devoluciones],
  templateUrl: './layout-home.html',
  styleUrl: './layout-home.css'
})
export class LayoutHome {

}

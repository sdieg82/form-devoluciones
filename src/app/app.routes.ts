import { Routes } from '@angular/router';
import { Devoluciones } from './devoluciones/devoluciones';
import { LayoutHome } from './layout-home/layout-home';
import { NavBar } from './nav-bar/nav-bar';
import { Promociones } from './promociones/promociones';

export const routes: Routes = [
    {
        path:'',
        redirectTo:'promociones',
        pathMatch: 'full'
    },
    {
        path:'main',
        component:LayoutHome
    },
    {
        path:'promociones',
        component:Promociones
    },
    {
        path:'devoluciones',
        component:Devoluciones
    },

    {
        path:'**',
        redirectTo:'promociones'
    }
];



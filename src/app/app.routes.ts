import { Routes } from '@angular/router';
import { Devoluciones } from './devoluciones/devoluciones';

export const routes: Routes = [
    {
        path:'',
        redirectTo:'main',
        pathMatch: 'full'
    },
    {
        path:'main',
        component:Devoluciones
    },
    {
        path:'**',
        redirectTo:'main'
    }
];



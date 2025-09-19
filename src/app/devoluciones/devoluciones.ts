import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormsModule, ReactiveFormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

interface Producto {
  codigo: string;
  descripcion: string;
}

@Component({
  selector: 'app-devoluciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './devoluciones.html',
  styleUrl: './devoluciones.css'
})
export class Devoluciones {
  fechaActual = new Date();

productos: Producto[] = [
  { codigo: '112131', descripcion: 'PAN EMP MODERNA BLANCO 550G' },
  { codigo: '113684', descripcion: 'PAN EMP MODERNA INTEGRAL 575G' },
  { codigo: '113685', descripcion: 'PAN EMP MODERNA INTEGRAL 350G' },
  { codigo: '113681', descripcion: 'PAN EMP SANDUCHERO INT 800 G N' },
  { codigo: '112133', descripcion: 'PAN EMP BLANCO SANDUCHERO MODERNA 550G' },
  { codigo: '109275', descripcion: 'PAN MOD ARTESANAL BLANCO 560G' },
  { codigo: '112748', descripcion: 'PAN EMP ARTESANAL INTEGRAL 500G' },
  { codigo: '13826', descripcion: 'PAN EMP GOURMET CINCO CEREALES 675G' },
  { codigo: '118070', descripcion: 'PAN EMP GOURMET BRIOCHE 600G' },
  { codigo: '116411', descripcion: 'PAN MODERNA DOBLE FIBRA 100% INT 650G' },
  { codigo: '111669', descripcion: 'PAN GOURMET GRANOLA MANZANA Y MACAD 500G' },
  { codigo: '111668', descripcion: 'PAN GOURMET GRANOLA FRUTOS Y ALMEN 500G' },
  { codigo: '111670', descripcion: 'PAN GOURMET GRANOLA MORAS Y NUECES 500G' },
  { codigo: '100758', descripcion: 'PAN EMP MODERNA CHOCOPAN RODAJAS 450G' },
  { codigo: '100775', descripcion: 'PAN EMP MODERNA HOT DOG 270G' },
  { codigo: '109043', descripcion: 'PAN EMP HOT DOG MODERNA GIG 8 UNID 560G' },
  { codigo: '107033', descripcion: 'PAN EMP MODERNA HAMBURGUESA 280G' },
  { codigo: '115084', descripcion: 'PAN HAMBURGUESA MODERNA 520G' },
  { codigo: '118160', descripcion: 'PAN BLANCO FLOR DE ORO 550GR' },
  { codigo: '118259', descripcion: 'PAN INTEGRAL FLOR DE ORO 600GR' },
  { codigo: '115288', descripcion: 'PONQUE CHOCOLATE CHOCOBOOM 63G' },
  { codigo: '110151', descripcion: 'APANADURA DORADITA MODERNA 150G' },
  { codigo: '110149', descripcion: 'APANADURA DORADITA MODERNA 250G' },
  { codigo: '110150', descripcion: 'APANADURA DORADITA MODERNA 500G' },
  { codigo: '118593', descripcion: 'APANADURA DORADITA MAGGI 300G' },
  { codigo: '000000', descripcion: 'BANDEJAS DEVUELTAS' },
];

  formulario: FormGroup;

  constructor(private fb: FormBuilder) {
    // Cambiar la inicialización para usar null en lugar de 0
    this.formulario = this.fb.group({
      unidades: this.fb.array(this.productos.map(() => this.fb.control(null)))
    });
  }

  // Método para manejar el focus en los inputs
  onFocus(event: FocusEvent, index: number) {
    const input = event.target as HTMLInputElement;
    const control = (this.formulario.get('unidades') as FormArray).at(index);
    
    // Si el valor es 0 o null, seleccionar todo el texto
    if (control.value === 0 || control.value === null) {
      setTimeout(() => {
        input.select();
      }, 0);
    }
  }

  // Método para manejar cuando se escribe en el input
  onInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const control = (this.formulario.get('unidades') as FormArray).at(index);
    
    // Si el campo estaba vacío o era 0, reemplazar completamente
    if (control.value === 0 || control.value === null) {
      const newValue = input.value.replace(/^0+/, '') || '0';
      control.setValue(parseInt(newValue) || 0);
    }
  }

  exportarExcel() {
  const valores = (this.formulario.get('unidades') as FormArray).value;
  const fechaCreacion = new Date().toLocaleDateString('es-ES');
  
  // Crear el header personalizado
  const headerData = [
    { Codigo: 'DEVOLUCIONES PAN', Descripción: '', Cantidad: '' },
    { Codigo: `Fecha: ${fechaCreacion}`, Descripción: '', Cantidad: '' },
    { Codigo: '', Descripción: '', Cantidad: '' }, // Fila vacía para separar
    { Codigo: 'Código', Descripción: 'Descripción', Cantidad: 'Cantidad' } // Headers de columna
  ];
  
  // Crear los datos de productos
  const productosData = this.productos.map((prod, idx) => ({
    Codigo: prod.codigo,
    Descripción: prod.descripcion,
    Cantidad: valores[idx] || 0
  }));
  
  // Combinar header con datos
  const allData = [...headerData, ...productosData];
  
  const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(allData);
  
  // Opcional: Mejorar el formato del header
  // Mergear celdas para el título principal
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push(
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Mergear "DEVOLUCIONES PAN"
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }  // Mergear la fecha
  );
  
  // Establecer ancho de columnas
  ws['!cols'] = [
    { width: 15 }, // Código
    { width: 50 }, // Descripción  
    { width: 10 }  // Cantidad
  ];
  
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Devoluciones');
  
  XLSX.writeFile(wb, `devoluciones_${fechaCreacion.replace(/\//g, '-')}.xlsx`);
}

}








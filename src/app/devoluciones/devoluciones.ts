
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
export class Devoluciones implements OnInit {
  fechaActual = new Date();

productosBase: Producto[] = [
  { codigo: '112131', descripcion: 'PAN EMP MODERNA BLANCO 550G' },
  { codigo: '113684', descripcion: 'PAN EMP MODERNA INTEGRAL 575G' },
  { codigo: '113685', descripcion: 'PAN EMP MODERNA INTEGRAL 350G' },
  { codigo: '112132', descripcion: 'PAN BLANCO SANDUCHERO 800G' },
  { codigo: '113681', descripcion: 'PAN EMP SANDUCHERO INT 800 G N' },
  { codigo: '112133', descripcion: 'PAN EMP BLANCO SANDUCHERO MODERNA 550G' },
  { codigo: '109275', descripcion: 'PAN MOD ARTESANAL BLANCO 560G' },
  { codigo: '112748', descripcion: 'PAN EMP ARTESANAL INTEGRAL 500G' },
  { codigo: '13826', descripcion: 'PAN EMP GOURMET CINCO CEREALES 675G' },
  { codigo: '118070', descripcion: 'PAN EMP GOURMET BRIOCHE 600G' },
  { codigo: '116411', descripcion: 'PAN MODERNA DOBLE FIBRA 100% INT 650G' },
  { codigo: '111669', descripcion: 'PAN GOURMET GRANOLA MANZANA Y MACAD 500G' },
  { codigo: '111668', descripcion: 'PAN GOURMET GRANOLA FRUTOS Y ALMEN 500G' },
  { codigo: '111669', descripcion: 'PAN GOURMET GRANOLA MANZANA 500G' },
  { codigo: '111670', descripcion: 'PAN GOURMET GRANOLA MORAS Y NUECES 500G' },
  { codigo: '100758', descripcion: 'PAN EMP MODERNA CHOCOPAN RODAJAS 450G' },
  { codigo: '100775', descripcion: 'PAN EMP MODERNA HOT DOG 270G' },
  { codigo: '109043', descripcion: 'PAN EMP HOT DOG MODERNA GIG 8 UNID 560G' },
  { codigo: '107033', descripcion: 'PAN EMP MODERNA HAMBURGUESA 280G' },
  { codigo: '115084', descripcion: 'PAN HAMBURGUESA MODERNA 520G' },
  { codigo: '118160', descripcion: 'PAN BLANCO FLOR DE ORO 550GR' },
  { codigo: '118259', descripcion: 'PAN INTEGRAL FLOR DE ORO 600GR' },
  { codigo: '115288', descripcion: 'PONQUE CHOCOLATE CHOCOBOOM 63G' },
  { codigo: '117205', descripcion: 'PONQUE CHOCOBOOM MANICHO 34G' },
  { codigo: '110151', descripcion: 'APANADURA DORADITA MODERNA 150G' },
  { codigo: '110149', descripcion: 'APANADURA DORADITA MODERNA 250G' },
  { codigo: '110150', descripcion: 'APANADURA DORADITA MODERNA 500G' },
  { codigo: '118593', descripcion: 'APANADURA DORADITA MAGGI 300G' },
  { codigo: '118296', descripcion: 'PAN BLANCO ECONOMAS 500G' },
  { codigo: '116456', descripcion: 'PAN GOURMET MASA MADRE 600G' },
  { codigo: '115475', descripcion: 'TOSTADAS INTEGRALES MODERNAS 100G' },
  { codigo: '115474', descripcion: 'TOSTADAS NATURALES 100G' },
  { codigo: '000000', descripcion: 'BANDEJAS DEVUELTAS' },
];


  productos: Producto[] = [];
  formulario: FormGroup;
  nuevoProductoForm: FormGroup;
  mostrarFormulario = false;

  constructor(private fb: FormBuilder) {
    this.nuevoProductoForm = this.fb.group({
      codigo: ['', [Validators.required]],
      descripcion: ['', [Validators.required]]
    });

    this.formulario = this.fb.group({
      unidades: this.fb.array([])
    });
  }

  ngOnInit() {
    this.cargarProductos();
    this.actualizarFecha();
  }

  // Actualizar fecha automáticamente cada día
  actualizarFecha() {
    const ahora = new Date();
    const fechaGuardada = localStorage.getItem('fechaUltimaActualizacion');
    
    if (!fechaGuardada || new Date(fechaGuardada).toDateString() !== ahora.toDateString()) {
      this.fechaActual = ahora;
      localStorage.setItem('fechaUltimaActualizacion', ahora.toISOString());
      // Limpiar cantidades si es un nuevo día
      this.limpiarFormulario();
    }
  }

  // Cargar productos desde localStorage
  cargarProductos() {
    const productosGuardados = localStorage.getItem('productosPersonalizados');
    const productosPersonalizados = productosGuardados ? JSON.parse(productosGuardados) : [];
    
    // Combinar productos base con personalizados
    this.productos = [...this.productosBase, ...productosPersonalizados];
    
    // Recrear el FormArray con los productos actualizados
    const unidadesArray = this.fb.array(
      this.productos.map(() => this.fb.control(null))
    );
    this.formulario.setControl('unidades', unidadesArray);

    // Cargar cantidades guardadas del día actual
    this.cargarCantidades();
  }

  // Guardar cantidades en localStorage
  guardarCantidades() {
    const valores = (this.formulario.get('unidades') as FormArray).value;
    const fecha = this.fechaActual.toDateString();
    localStorage.setItem(`cantidades_${fecha}`, JSON.stringify(valores));
  }

  // Cargar cantidades guardadas
  cargarCantidades() {
    const fecha = this.fechaActual.toDateString();
    const cantidadesGuardadas = localStorage.getItem(`cantidades_${fecha}`);
    
    if (cantidadesGuardadas) {
      const valores = JSON.parse(cantidadesGuardadas);
      const unidadesArray = this.formulario.get('unidades') as FormArray;
      
      valores.forEach((valor: number, index: number) => {
        if (unidadesArray.at(index)) {
          unidadesArray.at(index).setValue(valor);
        }
      });
    }
  }

  // Limpiar formulario para nuevo día
  limpiarFormulario() {
    const unidadesArray = this.formulario.get('unidades') as FormArray;
    unidadesArray.controls.forEach(control => control.setValue(null));
  }

  


  // Agregar nuevo producto
  agregarProducto() {
    if (this.nuevoProductoForm.valid) {
      const nuevoProducto = this.nuevoProductoForm.value;
      
      // Obtener productos personalizados actuales
      const productosGuardados = localStorage.getItem('productosPersonalizados');
      const productosPersonalizados = productosGuardados ? JSON.parse(productosGuardados) : [];
      
      // Agregar el nuevo producto
      productosPersonalizados.push(nuevoProducto);
      
      // Guardar en localStorage
      localStorage.setItem('productosPersonalizados', JSON.stringify(productosPersonalizados));
      
      // Recargar productos
      this.cargarProductos();
      
      // Limpiar formulario
      this.nuevoProductoForm.reset();
      this.mostrarFormulario = false;
    }
  }

  // Eliminar producto personalizado
  eliminarProductoPersonalizado(index: number) {
    const indexPersonalizado = index - this.productosBase.length;
    
    if (indexPersonalizado >= 0) {
      const productosGuardados = localStorage.getItem('productosPersonalizados');
      const productosPersonalizados = productosGuardados ? JSON.parse(productosGuardados) : [];
      
      productosPersonalizados.splice(indexPersonalizado, 1);
      localStorage.setItem('productosPersonalizados', JSON.stringify(productosPersonalizados));
      
      this.cargarProductos();
    }
  }

  // Verificar si es producto personalizado
  esProductoPersonalizado(index: number): boolean {
    return index >= this.productosBase.length;
  }

  // Métodos existentes (sin cambios)
  onFocus(event: FocusEvent, index: number) {
    const input = event.target as HTMLInputElement;
    const control = (this.formulario.get('unidades') as FormArray).at(index);
    
    if (control.value === 0 || control.value === null) {
      setTimeout(() => {
        input.select();
      }, 0);
    }
  }

  onInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const control = (this.formulario.get('unidades') as FormArray).at(index);
    
    if (control.value === 0 || control.value === null) {
      const newValue = input.value.replace(/^0+/, '') || '0';
      control.setValue(parseInt(newValue) || 0);
    }
    
    // Guardar automáticamente
    this.guardarCantidades();
  }

  exportarExcel() {
    const valores = (this.formulario.get('unidades') as FormArray).value;
    const fechaCreacion = this.fechaActual.toLocaleDateString('es-ES');
    
    const headerData = [
      { Codigo: 'DEVOLUCIONES PAN', Descripción: '', Cantidad: '' },
      { Codigo: `Fecha: ${fechaCreacion}`, Descripción: '', Cantidad: '' },
      { Codigo: '', Descripción: '', Cantidad: '' },
      { Codigo: 'Código', Descripción: 'Descripción', Cantidad: 'Cantidad' }
    ];
    
    const productosData = this.productos.map((prod, idx) => ({
      Codigo: prod.codigo,
      Descripción: prod.descripcion,
      Cantidad: valores[idx] || 0
    }));
    
    const allData = [...headerData, ...productosData];
    
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(allData);
    
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push(
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }
    );
    
    ws['!cols'] = [
      { width: 15 },
      { width: 50 },
      { width: 10 }
    ];
    
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Devoluciones');
    
    XLSX.writeFile(wb, `devoluciones_${fechaCreacion.replace(/\//g, '-')}.xlsx`);
  }
}

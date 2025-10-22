import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import * as XLSX from 'xlsx';
import { FilterPipe } from '../pipes/pipes-pipe';
import { NavBar } from "../nav-bar/nav-bar";

interface Producto {
  codigo: string;
  descripcion: string;
}
interface RegistroVenta {
  fecha: Date;
  cliente: string;
  factura: string;
  producto: string;
  unidadesVendidas: number;
  unidadesPromociones: number;
  valor: number;
}

@Component({
  selector: 'app-promociones',
  imports: [
    NavBar, 
    CommonModule,
    FormsModule,
    ReactiveFormsModule, 
    FilterPipe
  ],
  templateUrl: './promociones.html',
  styleUrl: './promociones.css'
})
export class Promociones implements OnInit {
  fechaActual = new Date();
  searchTerm:string ='';
  registrosVentas: RegistroVenta[] = []; // Nueva propiedad
  totalGeneral: number = 0; // Nueva propiedad

productosBase: Producto[] = [
];


  productos: Producto[] = [];
  formulario: FormGroup;
  nuevoProductoForm: FormGroup;
  mostrarFormulario = false;

  constructor(
    private readonly fb: FormBuilder
  ) {
    this.nuevoProductoForm = this.fb.group({
      codigo: ['', [Validators.required]],
      descripcion: ['', [Validators.required]]
    });

    this.formulario = this.fb.group({
      unidades: this.fb.array([])
    });

      this.nuevoProductoForm = this.fb.group({
      fecha: [new Date(), [Validators.required]],
      cliente: ['', [Validators.required, Validators.minLength(2)]],
      factura: ['', [Validators.required]],
      producto: ['', [Validators.required]],
      unidadesVendidas: [0, [Validators.required, Validators.min(0)]],
      unidadesPromociones: [0, [Validators.required, Validators.min(0)]],
      valor: [0, [Validators.required, Validators.min(0)]]
    });

    // Configurar el formulario principal
    this.formulario = this.fb.group({
      unidades: this.fb.array([])
    });

    // Suscribirse a cambios en unidades vendidas, promociones y valor para calcular automáticamente
    this.nuevoProductoForm.get('unidadesVendidas')?.valueChanges.subscribe(() => this.calcularTotal());
    this.nuevoProductoForm.get('unidadesPromociones')?.valueChanges.subscribe(() => this.calcularTotal());
    this.nuevoProductoForm.get('valor')?.valueChanges.subscribe(() => this.calcularTotal());


  }

  ngOnInit() {
    this.cargarProductos();
    this.cargarRegistrosVentas();
    this.actualizarFecha();
  }

  

  // En tu componente, agrega este getter:
get productosFiltrados() {
  if (!this.searchTerm) return this.productos;
  return this.productos.filter(producto =>
    producto.codigo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
    producto.descripcion.toLowerCase().includes(this.searchTerm.toLowerCase())
  );
}

// Agregar método para obtener índice real
obtenerIndiceReal(producto: any): number {
  return this.productos.findIndex(p => p.codigo === producto.codigo && p.descripcion === producto.descripcion);
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

  
calcularTotal() {
    const unidadesVendidas = this.nuevoProductoForm.get('unidadesVendidas')?.value || 0;
    const unidadesPromociones = this.nuevoProductoForm.get('unidadesPromociones')?.value || 0;
    const valor = this.nuevoProductoForm.get('valor')?.value || 0;
    
    // El total sería el valor multiplicado por el total de unidades
    const totalUnidades = unidadesVendidas + unidadesPromociones;
    this.totalGeneral = totalUnidades * valor;
  }

  // Modificar el método agregarProducto
  agregarProducto() {
    if (this.nuevoProductoForm.valid) {
      const nuevoRegistro: RegistroVenta = {
        fecha: this.nuevoProductoForm.get('fecha')?.value,
        cliente: this.nuevoProductoForm.get('cliente')?.value,
        factura: this.nuevoProductoForm.get('factura')?.value,
        producto: this.nuevoProductoForm.get('producto')?.value,
        unidadesVendidas: this.nuevoProductoForm.get('unidadesVendidas')?.value,
        unidadesPromociones: this.nuevoProductoForm.get('unidadesPromociones')?.value,
        valor: this.nuevoProductoForm.get('valor')?.value
      };

      // Agregar a la lista de registros
      this.registrosVentas.push(nuevoRegistro);
      
      // Guardar en localStorage
      this.guardarRegistrosVentas();
      
      // Limpiar formulario pero mantener la fecha actual
      this.nuevoProductoForm.reset({
        fecha: new Date(),
        cliente: '',
        factura: '',
        producto: '',
        unidadesVendidas: 0,
        unidadesPromociones: 0,
        valor: 0
      });
      
      this.mostrarFormulario = false;
      this.totalGeneral = 0;
    }
  }

  // Nueva función para cargar registros de ventas
  cargarRegistrosVentas() {
    const fecha = this.fechaActual.toDateString();
    const registrosGuardados = localStorage.getItem(`registrosVentas_${fecha}`);
    
    if (registrosGuardados) {
      this.registrosVentas = JSON.parse(registrosGuardados).map((registro: any) => ({
        ...registro,
        fecha: new Date(registro.fecha)
      }));
    }
  }

  // Nueva función para guardar registros de ventas
  guardarRegistrosVentas() {
    const fecha = this.fechaActual.toDateString();
    localStorage.setItem(`registrosVentas_${fecha}`, JSON.stringify(this.registrosVentas));
  }

  // Nueva función para eliminar registro
  eliminarRegistro(index: number) {
    this.registrosVentas.splice(index, 1);
    this.guardarRegistrosVentas();
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

    // Nueva función para obtener el total de todos los registros
  getTotalRegistros(): number {
    return this.registrosVentas.reduce((total, registro) => {
      const totalUnidades = registro.unidadesVendidas + registro.unidadesPromociones;
      return total + (totalUnidades * registro.valor);
    }, 0);
  }

  // Modificar limpiarFormulario para incluir registros
  limpiarFormulario() {
    const unidadesArray = this.formulario.get('unidades') as FormArray;
    unidadesArray.controls.forEach(control => control.setValue(null));
    
    // Limpiar también los registros de ventas
    this.registrosVentas = [];
    const fecha = this.fechaActual.toDateString();
    localStorage.removeItem(`registrosVentas_${fecha}`);
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


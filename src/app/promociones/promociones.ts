import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import * as XLSX from 'xlsx';
import { NavBar } from "../nav-bar/nav-bar";

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
    ReactiveFormsModule
  ],
  templateUrl: './promociones.html',
  styleUrl: './promociones.css'
})
export class Promociones implements OnInit {
  fechaActual = new Date();
  registrosVentas: RegistroVenta[] = [];
  totalGeneral: number = 0;
  nuevoProductoForm: FormGroup;
  mostrarFormulario = false;

  constructor(private readonly fb: FormBuilder) {
    this.nuevoProductoForm = this.fb.group({
      fecha: [new Date().toISOString().split('T')[0], [Validators.required]],
      cliente: ['', [Validators.required, Validators.minLength(2)]],
      factura: ['', [Validators.required]],
      producto: ['', [Validators.required]],
      unidadesVendidas: [0, [Validators.required, Validators.min(0)]],
      unidadesPromociones: [0, [Validators.required, Validators.min(0)]],
      valor: [0, [Validators.required, Validators.min(0)]]
    });

    // Suscribirse a cambios para calcular automáticamente
    this.nuevoProductoForm.get('unidadesVendidas')?.valueChanges.subscribe(() => this.calcularTotal());
    this.nuevoProductoForm.get('unidadesPromociones')?.valueChanges.subscribe(() => this.calcularTotal());
    this.nuevoProductoForm.get('valor')?.valueChanges.subscribe(() => this.calcularTotal());
  }

  ngOnInit() {
    this.cargarRegistrosVentas();
    this.actualizarFecha();
  }

  // Actualizar fecha automáticamente cada día
  actualizarFecha() {
    const ahora = new Date();
    const fechaGuardada = localStorage.getItem('fechaUltimaActualizacionPromociones');
    
    if (!fechaGuardada || new Date(fechaGuardada).toDateString() !== ahora.toDateString()) {
      this.fechaActual = ahora;
      localStorage.setItem('fechaUltimaActualizacionPromociones', ahora.toISOString());
      // Limpiar registros si es un nuevo día
      this.limpiarFormulario();
    }
  }

  // Calcular total automáticamente
  calcularTotal() {
    const unidadesVendidas = this.nuevoProductoForm.get('unidadesVendidas')?.value || 0;
    const unidadesPromociones = this.nuevoProductoForm.get('unidadesPromociones')?.value || 0;
    const valor = this.nuevoProductoForm.get('valor')?.value || 0;
    
    const totalUnidades = unidadesVendidas + unidadesPromociones;
    this.totalGeneral = totalUnidades * valor;
  }

  // Agregar nuevo registro
  agregarProducto() {
    if (this.nuevoProductoForm.valid) {
      const nuevoRegistro: RegistroVenta = {
        fecha: new Date(this.nuevoProductoForm.get('fecha')?.value),
        cliente: this.nuevoProductoForm.get('cliente')?.value,
        factura: this.nuevoProductoForm.get('factura')?.value,
        producto: this.nuevoProductoForm.get('producto')?.value,
        unidadesVendidas: this.nuevoProductoForm.get('unidadesVendidas')?.value,
        unidadesPromociones: this.nuevoProductoForm.get('unidadesPromociones')?.value,
        valor: this.nuevoProductoForm.get('valor')?.value
      };

      this.registrosVentas.push(nuevoRegistro);
      this.guardarRegistrosVentas();
      
      // Resetear el formulario manteniendo la fecha actual
      this.nuevoProductoForm.reset({
        fecha: new Date().toISOString().split('T')[0],
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

  // Cargar registros de ventas del localStorage
  cargarRegistrosVentas() {
    const fecha = this.fechaActual.toDateString();
    const registrosGuardados = localStorage.getItem(`registrosPromociones_${fecha}`);
    
    if (registrosGuardados) {
      this.registrosVentas = JSON.parse(registrosGuardados).map((registro: any) => ({
        ...registro,
        fecha: new Date(registro.fecha)
      }));
    }
  }

  // Guardar registros de ventas en localStorage
  guardarRegistrosVentas() {
    const fecha = this.fechaActual.toDateString();
    localStorage.setItem(`registrosPromociones_${fecha}`, JSON.stringify(this.registrosVentas));
  }

  // Eliminar registro específico
  eliminarRegistro(index: number) {
    this.registrosVentas.splice(index, 1);
    this.guardarRegistrosVentas();
  }

  // Obtener el total de todos los registros
  getTotalRegistros(): number {
    return this.registrosVentas.reduce((total, registro) => {
      const totalUnidades = registro.unidadesVendidas + registro.unidadesPromociones;
      return total + totalUnidades;
    }, 0);
  }

  // Limpiar formulario y registros
  limpiarFormulario() {
    this.registrosVentas = [];
    const fecha = this.fechaActual.toDateString();
    localStorage.removeItem(`registrosPromociones_${fecha}`);
  }

  // Seleccionar todo el texto en inputs
  selectAllText(event: any) {
    setTimeout(() => {
      const input = event.target as HTMLInputElement;
      if (input && input.select) {
        input.select();
      }
      if (input && input.setSelectionRange) {
        input.setSelectionRange(0, input.value.length);
      }
    }, 0);
  }

  // Manejar cambio de fecha
  onDateChange(event: any) {
    const selectedDate = event.target.value;
    if (selectedDate) {
      setTimeout(() => {
        event.target.blur();
      }, 100);
    }
  }

  // Exportar registros de promociones a Excel
  exportarExcel() {
    const fechaCreacion = this.fechaActual.toLocaleDateString('es-ES');
    
    // Si no hay registros, mostrar mensaje
    if (this.registrosVentas.length === 0) {
      alert('No hay registros de promociones para exportar');
      return;
    }

    // Cabecera del Excel
    const headerData = [
      { Fecha: `Fecha: ${fechaCreacion}`, Cliente: '', Factura: '', Producto: '', 'U. Vendidas': '', 'U. Promociones': '', 'Valor Unit.': '', Total: '' },
      { Fecha: '', Cliente: '', Factura: '', Producto: '', 'U. Vendidas': '', 'U. Promociones': '', 'Valor Unit.': '', Total: '' },
      { Fecha: 'Fecha', Cliente: 'Cliente', Factura: 'Factura', Producto: 'Producto', 'U. Vendidas': 'U. Vendidas', 'U. Promociones': 'U. Promociones', 'Valor Unit.': 'Valor Unitario', Total: 'Total' }
    ];
    
    // Datos de los registros
    const registrosData = this.registrosVentas.map(registro => ({
      Fecha: registro.fecha.toLocaleDateString('es-ES'),
      Cliente: registro.cliente,
      Factura: registro.factura,
      Producto: registro.producto,
      'U. Vendidas': registro.unidadesVendidas,
      'U. Promociones': registro.unidadesPromociones,
      'Valor Unit.': registro.valor,
      Total: (registro.unidadesVendidas + registro.unidadesPromociones)
    }));

    // Fila de total general
    const totalData = [
      { Fecha: '', Cliente: '', Factura: '', Producto: '', 'U. Vendidas': '', 'U. Promociones': '', 'Valor Unit.': 'TOTAL GENERAL:', Total: this.getTotalRegistros() }
    ];
    
    const allData = [...headerData, ...registrosData, ...totalData];
    
    // Crear hoja de Excel
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(allData);
    
    // Configurar combinaciones de celdas para la cabecera
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push(
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Título principal
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }  // Fecha
    );
    
    // Configurar ancho de columnas
    ws['!cols'] = [
      { width: 12 }, // Fecha
      { width: 20 }, // Cliente
      { width: 15 }, // Factura
      { width: 30 }, // Producto
      { width: 12 }, // U. Vendidas
      { width: 12 }, // U. Promociones
      { width: 12 }, // Valor Unit.
      { width: 15 }  // Total
    ];
    
    // Crear libro y agregar hoja
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Promociones');

    // Descargar archivo
    XLSX.writeFile(wb, `promociones_${fechaCreacion.replace(/\//g, '-')}.xlsx`);
  }
}

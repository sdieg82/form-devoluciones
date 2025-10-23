import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import * as XLSX from 'xlsx';
import { NavBar } from "../nav-bar/nav-bar";

// Declarar Bootstrap para poder usar el modal
declare var bootstrap: any;

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
  modalInstance: any; // Para controlar el modal

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

  // Inicializar formulario
  inicializarFormulario() {}

  // Abrir modal
  abrirModal() {
    // Resetear formulario con valores por defecto
    this.nuevoProductoForm.reset({
      fecha: new Date().toISOString().split('T')[0],
      cliente: '',
      factura: '',
      producto: '',
      unidadesVendidas: 0,
      unidadesPromociones: 0,
      valor: 0
    });
    
    this.totalGeneral = 0;
    
    // Abrir modal de Bootstrap
    const modalElement = document.getElementById('promocionModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement);
      this.modalInstance.show();
    }
  }

  // Cerrar modal
  cerrarModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
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
      
      // Cerrar modal después de agregar
      this.cerrarModal();
      
      // Mostrar mensaje de éxito (opcional)
      console.log('Registro agregado exitosamente');
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

// Validar entrada numérica (solo números enteros)
validateNumericInput(event: any) {
  const input = event.target;
  const value = input.value;
  
  // Remover cualquier carácter que no sea número
  const numericValue = value.replace(/[^0-9]/g, '');
  
  // Actualizar el valor del input y el FormControl
  input.value = numericValue;
  
  // Actualizar el FormControl
  const controlName = input.getAttribute('formControlName');
  if (controlName) {
    this.nuevoProductoForm.get(controlName)?.setValue(numericValue ? parseInt(numericValue) : 0);
  }
}

// Validar entrada decimal (números con punto decimal)
validateDecimalInput(event: any) { const input = event.target as HTMLInputElement;
    let value = input.value;
    let key = event['data'];
  
    // Detectar si es un dispositivo iOS
    const isIos = (): boolean => /iphone|ipad|ipod/i.test(navigator.userAgent);
  
    // Reemplazar todas las comas por puntos (para soporte en iOS)
    value = value.replace(/,/g, '.');
  
    // También reemplazar la tecla presionada si es una coma
    if (isIos() && key === ',') {
      key = '.';
    }
  
    // Permitir solo números y un único punto decimal
    value = value.replace(/[^0-9.]/g, '');
  
    // Asegurar que solo haya un punto decimal
    const parts = value.split('.');
    if (parts.length > 2) {
      value = `${parts[0]}.${parts[1]}`;
    }
  
    // No permitir más de dos decimales
    if (parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].substring(0, 2);
      value = `${parts[0]}.${parts[1]}`;
    }
  
    // Evitar múltiples ceros al inicio, excepto en "0."
    if (value.startsWith('0') && !value.startsWith('0.') && value.length > 1) {
      value = value.replace(/^0+(?!\.)/, '');
    }
  
    // Si el usuario solo ingresa un punto, convertirlo en "0."
    if (value === '.') {
      value = '0.';
    }
  
    // Actualizar el valor en el formulario sin emitir evento
    input.value = value;
  
  // Actualizar el FormControl
  const controlName = input.getAttribute('formControlName');
  if (controlName) {
    this.nuevoProductoForm.get(controlName)?.setValue(value ? parseFloat(value) : 0);
  }
}

// Actualizar el método calcularTotal para usar solo unidades promocionales
calcularTotal() {
  const unidadesPromociones = this.nuevoProductoForm.get('unidadesPromociones')?.value || 0;
  const valor = this.nuevoProductoForm.get('valor')?.value || 0;
  
  // El total es solo unidades promocionales por el costo promocional
  this.totalGeneral = unidadesPromociones * valor;
}

// Actualizar getTotalRegistros para el nuevo cálculo
getTotalRegistros(): number {
  return this.registrosVentas.reduce((total, registro) => {
    return total + (registro.unidadesPromociones * registro.valor);
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
      { Fecha: `Fecha: ${fechaCreacion}`, Cliente: '', Factura: '', Producto: '', 'U. Vendidas': '', 'U. Promociones': '', 'Costo Promocional': '', Total: '' },
      { Fecha: '', Cliente: '', Factura: '', Producto: '', 'U. Vendidas': '', 'U. Promociones': '', 'Costo Promocional': '', Total: '' },
      { Fecha: 'Fecha', Cliente: 'Cliente', Factura: 'Factura', Producto: 'Producto', 'U. Vendidas': 'U. Vendidas', 'U. Promociones': 'U. Promociones', 'Costo Promocional': 'Valor Unitario', Total: 'Total' }
    ];
    
    // Datos de los registros
    const registrosData = this.registrosVentas.map(registro => ({
      Fecha: registro.fecha.toLocaleDateString('es-ES'),
      Cliente: registro.cliente,
      Factura: registro.factura,
      Producto: registro.producto,
      'U. Vendidas': registro.unidadesVendidas,
      'U. Promociones': registro.unidadesPromociones,
      'Costo Promocional':` $ ${registro.valor}`,
      Total: (registro.unidadesVendidas + registro.unidadesPromociones)
    }));

    // Fila de total general
    const totalData = [
      { Fecha: '', Cliente: '', Factura: '', Producto: '', 'U. Vendidas': '', 'U. Promociones': '', 'Costo Promocional': 'TOTAL GENERAL:', Total: this.getTotalRegistros() }
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
      { width: 12 }, // Costo Promocional
      { width: 15 }  // Total
    ];
    
    // Crear libro y agregar hoja
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Promociones');

    // Descargar archivo
    XLSX.writeFile(wb, `promociones_${fechaCreacion.replace(/\//g, '-')}.xlsx`);
  }
}

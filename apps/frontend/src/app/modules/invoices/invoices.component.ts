import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { InvoiceService } from '../../services/invoices.service';
import {
  IInvoice,
  IInvoiceItems,
} from '../../../../../../libs/typings/src/model/index';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'crtvs-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss'],
})
export class InvoicesComponent implements OnInit {
  invoicesForm!: FormGroup;
  rowAmount = 0;
  totalAmount = 0;
  quantity = 0;
  priceWithoutVat = 0;
  vatPercent = 0;
  invoice!: IInvoice;
  invoiceId!: number | undefined;
  get rowData() {
    return this.invoicesForm.get('rowData') as FormArray;
  }
  public currencies = [
    { exchangeRate: 1, currencyCode: 'лв' },
    { exchangeRate: 1.95, currencyCode: '€' },
  ];
  currencyFormatters = {
    Лев: new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'BGN' }),
    Евро: new Intl.NumberFormat('bg-BG', {
      style: 'currency',
      currency: 'EUR',
    }),
  };

  selectedCurrency = this.currencies[0];
  constructor(
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {
    //
  }

  ngOnInit() {
    this.invoicesForm = this.fb.group({
      p_name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(40),
        ],
      ],
      p_eik: ['', Validators.required],
      p_ddsnumber: [''],
      p_mol: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(40),
          Validators.pattern('^([A-ZА-Я][a-zа-я]*([-\\s][A-ZА-Я][a-zа-я]*)+)$'),
        ],
      ],
      p_city: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(40),
        ],
      ],
      p_address: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(60),
        ],
      ],
      c_name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(60),
        ],
      ],
      c_person: [false],
      c_egn: [''],
      c_eik: [''],
      c_ddsnumber: [''],
      c_mol: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(40),
          Validators.pattern('^([A-ZА-Я][a-zа-я]*([-\\s][A-ZА-Я][a-zа-я]*)+)$'),
        ],
      ],
      c_city: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(60),
        ],
      ],
      c_address: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(60),
        ],
      ],
      type: ['', Validators.required], // neww
      issue_date: ['', Validators.required], //new
      event_date: ['', Validators.required], //new
      related_invoice: [],
      related_date: [],
      currency: [this.selectedCurrency, Validators.required],
      rowData: this.fb.array([
        this.fb.group({
          name: ['', Validators.required],
          quantity: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
          price: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
          measurement: [''],
          amount: [''],
        }),
      ]),
      vatPercent: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      wayOfPaying: ['', Validators.required],
      vatReason: ['', [Validators.minLength(4), Validators.maxLength(40)]],
    });
    // Subscribe to changes in the 'egn' control
    this.invoicesForm.get('c_egn')?.valueChanges.subscribe((value: string) => {
      const cPersonControl = this.invoicesForm.get('c_person');

      if (value && value.length > 0) {
        cPersonControl?.setValue(true);
      } else {
        cPersonControl?.setValue(false);
      }
    });
    this.invoicesForm.get('c_person')?.valueChanges.subscribe((c_person) => {
      const eikControl = this.invoicesForm.get('eik');
      const egnControl = this.invoicesForm.get('egn');

      if (c_person === true) {
        eikControl?.clearValidators();
        //egnControl?.setValidators([Validators.required, egnValidator()]);
      }

      eikControl?.updateValueAndValidity();
      egnControl?.updateValueAndValidity();
    });
    const receiverEikField = document.getElementById('receiverEik');
    const receiverVatNumberField = document.getElementById('receiverVatNumber');
    const receiverEgnField = document.getElementById('receiverEgn');

    this.invoicesForm
      .get('c_person')
      ?.valueChanges.subscribe((value: boolean) => {
        if (value) {
          receiverEikField?.classList.add('hidden');
          receiverVatNumberField?.classList.add('hidden');
          receiverEgnField?.classList.remove('hidden');
        } else {
          receiverEikField?.classList.remove('hidden');
          receiverVatNumberField?.classList.remove('hidden');
          receiverEgnField?.classList.add('hidden');
        }
      });

    const id = Number(this.route.snapshot.paramMap.get('id'));
    console.log('Retrieving invoice data for ID:', id);
    this.invoiceId = id ? id : undefined;
    if (id !== null) {
      this.invoiceService.getInvoiceById(id).subscribe((response: any) => {
        const invoice: IInvoice = response.invoice; // Cast the response

        this.invoiceService.getInvoiceById(id).subscribe({
          next: (data: IInvoice) => {
            console.log('Response Data:', JSON.stringify(data));
            this.invoice = data;

            this.invoicesForm.patchValue({
              p_name: invoice.p_name,
              p_eik: invoice.p_eik,
              p_ddsnumber: invoice.p_ddsnumber,
              p_mol: invoice.p_mol,
              p_city: invoice.p_city,
              p_address: invoice.p_address,
              c_name: invoice.c_name,
              c_person: invoice.c_person,
              c_egn: invoice.c_egn,
              c_eik: invoice.c_eik,
              c_ddsnumber: invoice.c_ddsnumber,
              c_mol: invoice.c_mol,
              c_city: invoice.c_city,
              c_address: invoice.c_address,
              issue_date: invoice.issue_date,
              event_date: invoice.event_date,
              currency: invoice.currency.currencyCode, // not showing
              type: String(invoice.type),
              vatPercent: invoice.vat,
              wayOfPaying: String(invoice.bank_payment),
              vatReason: invoice.novatreason,
              //rowData: invoice.items,
              rowData: [],
            });

            while (this.rowData.length !== 0) {
              this.rowData.removeAt(0);
            }

            // Add rows for each item in the invoice
            for (const item of invoice.items) {
              this.addRowWithData(item);
            }
          },
          error: (error) => {
            console.error(error);
          },
          complete: () => {
            console.log('Get invoice by id completed.');
          },
        });
      });
    }
  }

  addRowWithData(item: IInvoiceItems) {
    const rowData = this.invoicesForm.get('rowData') as FormArray;
    const row = this.fb.group({
      name: [item.name, Validators.required],
      quantity: [item.quantity, Validators.required],
      measurement: [item.measurement, Validators.required],
      price: [item.price, Validators.required],
      amount: [''],
    });
    rowData.push(row);
  }
  addRow() {
    const rowData = this.invoicesForm.get('rowData') as FormArray;
    const row = this.fb.group({
      name: ['', Validators.required],
      quantity: ['', Validators.required],
      measurement: ['', Validators.required],
      price: ['', Validators.required],
      amount: [''],
    });
    rowData.push(row);
  }

  deleteRow(index: number) {
    if (this.rowData.length > 1) {
      (this.invoicesForm.get('rowData') as FormArray).removeAt(index);
    }
  }
  calculateRowAmount(index: number): number {
    const rowData = this.invoicesForm.get('rowData') as FormArray;
    const quantity = rowData.at(index).get('quantity')?.value;
    const priceWithoutVat = rowData.at(index).get('price')?.value;
    return quantity * priceWithoutVat;
  }
  calculateTotalRowAmount(): number {
    let total = 0;
    const rowData = this.invoicesForm.get('rowData') as FormArray;
    for (let i = 0; i < rowData.length; i++) {
      total += this.calculateRowAmount(i);
    }
    return total;
  }
  calculateTotalAmountWthVat(): number {
    return (
      (this.calculateTotalRowAmount() *
        this.invoicesForm.get('vatPercent')?.value) /
        100 +
      this.calculateTotalRowAmount()
    );
  }

  onSubmit() {
    if (this.invoicesForm.invalid) {
      // Form is not valid, display error messages
      alert('Моля, въведете всички полета.');
      return;
    }
    const formData = this.invoicesForm.value;
    const dataInvoice: IInvoice = {
      prefix: 1, //-----------------???
      number: 1, //-----------------???
      contractor: 1, //----------------------????
      issue_date: formData.issue_date,
      event_date: formData.event_date,
      receiver: formData.c_name,
      bank_payment: 2, //--------------???
      vat: formData.vatPercent,
      novatreason: formData.vatReason,
      currency: formData.currency.currencyCode,
      rate: formData.currency.exchangeRate,
      type: formData.type,
      related_invoice: formData.related_invoice,
      related_date: formData.related_date,
      c_name: formData.c_name,
      c_city: formData.c_city,
      c_address: formData.c_address,
      c_eik: formData.c_eik,
      c_ddsnumber: formData.c_ddsnumber,
      c_mol: formData.c_mol,
      c_person: formData.c_person,
      c_egn: formData.c_egn,
      p_name: formData.p_name,
      p_city: formData.p_city,
      p_address: formData.p_address,
      p_eik: formData.p_eik,
      p_ddsnumber: formData.p_ddsnumber,
      p_mol: formData.p_mol,
      p_bank: 'Some bank',
      p_iban: 'Some iban',
      p_bic: 'Some bic',
      p_zdds: true,
      author: 'Some author',
      author_user: 1,
      author_sign: 'Some sign',
      items: [],
    };

    const rows = formData.rowData;
    //dataInvoice.items = []; // Clear existing items before adding updated items
    for (let i = 0; i < rows.length; i++) {
      const dataInvoicesItems: IInvoiceItems = {
        name: rows[i].name,
        quantity: rows[i].quantity,
        measurement: rows[i].measurement,
        price: rows[i].price,
      };
      dataInvoice.items.push(dataInvoicesItems); // add the new item to the items array
    }

    if (this.invoiceId) {
      // Update existing invoice
      this.invoiceService
        .updateInvoice(this.invoiceId, dataInvoice, dataInvoice.items)
        .subscribe({
          next: (response) => {
            console.log('HTTP request successful:', response);
            console.log('dataInvoice:', JSON.stringify(dataInvoice));

            const successMessage = 'Invoice updated successfully.';
            // Display success message to the user
            alert(successMessage);
          },
          error: (error) => {
            console.error('Error occurred:', error);
            const errorMessage = 'Invoice update failed. Please try again.';
            // Display error message to the user
            alert(errorMessage);
          },
        });
    } else {
      // Create new invoice
      this.invoiceService
        .createInvoice(dataInvoice, dataInvoice.items)
        .subscribe({
          next: (response) => {
            console.log('HTTP request successful:', response);
            const successMessage = 'Фактурата е създадена успешно.';
            // Display success message to the user
            alert(successMessage);
          },
          error: (error) => {
            console.error('Error occurred:', error);
            const errorMessage =
              'Създаването на фактура беше неуспешно, моля опитайте отново!';
            // Display error message to the user
            alert(errorMessage);
          },
          complete: () => {
            console.log('HTTP request complete');
          },
        });
    }
  }
}

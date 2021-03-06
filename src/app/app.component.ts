import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { COUNTRIES } from './consts/country.const';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, finalize, takeUntil } from 'rxjs/operators';
import { ApiService } from './services/api.service';
import { ActivatedRoute } from '@angular/router';
import { AddressModel } from './models/address.model';
import { Status } from './models/api-response.dto';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('streetInput') streetInput: ElementRef;
  form: FormGroup;
  formDefaultValues: any;
  ngUnsubscribe$: Subject<void>;
  apiResponse$: BehaviorSubject<any>;

  countries = COUNTRIES;
  streetFilter$ = new BehaviorSubject<{ id: string; description: string }[]>(null);
  isFetching = false;

  apiKey: string;
  status: Status;

  get country(): string {
    return this.form?.get('countryCode').value;
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private apiService: ApiService,
  ) {
  }

  ngOnInit(): void {
    this.ngUnsubscribe$ = new Subject<void>();
    this.apiResponse$ = new BehaviorSubject<any>(null);
    this.form = this.initForm();
    this.formDefaultValues = this.form.value;
    this.subscribeToValues();
    this.getApiKey();
  }

  initForm(): FormGroup {
    return this.fb.group({
      countryCode: ['de', Validators.required],
      city: ['', Validators.required],
      streetAddress: ['', Validators.required],
      postalCode: ['', Validators.required],
      houseNumber: ['', Validators.required],
    });
  }

  onSubmit(): void {
    console.log(this.form.getRawValue());
    const formValue = this.form.getRawValue();
    this.apiService.verifyAddress(formValue, this.apiKey)
      .pipe(
        takeUntil(this.ngUnsubscribe$)
      ).subscribe((data) => {
      this.status = data.status;
      this.apiResponse$.next(JSON.stringify(data, undefined, 2));
    });
  }

  resetForm(): void {
    this.form.reset(this.formDefaultValues);
    this.status = null;
  }

  subscribeToValues(): void {
    const street$ = this.form.get('streetAddress').valueChanges;
    street$.pipe(
      debounceTime(500),
      takeUntil(this.ngUnsubscribe$)
    ).subscribe((d) => {
      const formData = this.form.getRawValue();
      const query = this.constructQuery(formData);
      if (query.replace(/ /g, '') === '') {
        return;
      }
      console.log(query);

      this.apiService.getAutoCompleteQueryData(this.country, query, this.apiKey)
        .pipe(
          takeUntil(this.ngUnsubscribe$)
        ).subscribe(data => {
        this.streetFilter$.next(data.results);
        this.status = data.status;
        this.apiResponse$.next(JSON.stringify(data, undefined, 2));
      });
    });
  }

  constructQuery(formData: AddressModel): string {
    let firstAddress = '';
    if (formData.postalCode) {
      firstAddress = formData.postalCode;
    } else if (formData.city) {
      firstAddress = formData.city;
    }
    return [firstAddress, formData.streetAddress]
      .filter(e => !!e)
      .join(' ');
  }

  getApiKey(): void {
    this.route.queryParams.subscribe(params => {
      this.apiKey = params.apiKey;
    });
  }

  onChange(id: string): void {
    this.isFetching = true;
    this.apiService.retrieveAddress(id, this.apiKey)
      .pipe(
        takeUntil(this.ngUnsubscribe$),
        finalize(() => this.isFetching = false)
      ).subscribe((data) => {
      this.apiResponse$.next(JSON.stringify(data, undefined, 2));
      if (data) {
        this.form.setValue({
          countryCode: 'de',
          city: data.city || '',
          streetAddress: data.street || '',
          postalCode: data.postalcode || '',
          houseNumber: data.streetnumber || '',
        });
      }
    });
  }

  getClass(): string {
    switch (this.status) {
      case 'SUSPECT':
        return 'btn btn-warning';
      case 'INVALID':
        return 'btn btn-danger';
      case 'VALID':
        return 'btn btn-success';
      default:
        return 'btn btn-secondary';
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe$.next();
    this.ngUnsubscribe$.complete();
  }
}

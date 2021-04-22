import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { COUNTRIES } from './consts/country.const';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, finalize, takeUntil } from 'rxjs/operators';
import { ApiService } from './services/api.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  form: FormGroup;
  ngUnsubscribe$: Subject<void>;
  apiResponse$: BehaviorSubject<any>;

  countries = COUNTRIES;
  streetFilter$ = new BehaviorSubject<{ id: string; description: string }[]>(null);
  isFetching = false;

  apiKey: string;

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
    this.subscribeToValues();
    this.getApiKey();
  }

  initForm(): FormGroup {
    return this.fb.group({
      countryCode: [{value: 'de', disabled: true}],
      city: [''],
      streetAddress: [''],
      postalCode: [''],
      houseNumber: [''],
    });
  }

  onSubmit(): void {
    console.log(this.form.getRawValue());
    const formValue = this.form.getRawValue();
    this.apiService.verifyAddress(formValue, this.apiKey)
      .pipe(
        takeUntil(this.ngUnsubscribe$)
      ).subscribe((data) => {
        this.apiResponse$.next(JSON.stringify(data, undefined, 2));
    });
  }

  subscribeToValues(): void {
    const street$ = this.form.get('streetAddress').valueChanges;
    street$.pipe(
      debounceTime(1000),
      takeUntil(this.ngUnsubscribe$)
    ).subscribe(street => {
      if (!street) {
        return;
      }
      this.apiService.getAutoCompleteQueryData(this.country, street, this.apiKey)
        .pipe(
          takeUntil(this.ngUnsubscribe$)
        ).subscribe(data => {
        this.streetFilter$.next(data.results);
        this.apiResponse$.next(JSON.stringify(data, undefined, 2));
      });
    });
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

  ngOnDestroy(): void {
    this.ngUnsubscribe$.next();
    this.ngUnsubscribe$.complete();
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { QuerySearchResponseDto, VerificationResponseDto } from '../models/api-response.dto';
import { AddressModel } from '../models/address.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = environment.API_URL;

  constructor(private http: HttpClient) { }

  verifyAddress(data: AddressModel, apiKey): Observable<VerificationResponseDto> {
    return this.http.get<VerificationResponseDto>(`${this.apiUrl}/verify`, {
      params: {
        StreetAddress: data.streetAddress + ' ' + data.houseNumber,
        City: data.city,
        PostalCode: data.postalCode,
        CountryCode: data.countryCode,
        APIKey: apiKey,
      }
    });
  }

  getAutoCompleteQueryData(countryCode: string, data: string, apiKey: string): Observable<QuerySearchResponseDto> {
    return this.http.get<QuerySearchResponseDto>(`${this.apiUrl}/search`, {
      params: {
        CountryCode: countryCode,
        Query: data,
        APIKey: apiKey
      }
    });
  }

  retrieveAddress(id: string, apiKey: string): Observable<VerificationResponseDto> {
    return this.http.get<VerificationResponseDto>(`${this.apiUrl}/fetch`, {
      params: {
        ID: id,
        APIKey: apiKey,
      }
    });
  }
}

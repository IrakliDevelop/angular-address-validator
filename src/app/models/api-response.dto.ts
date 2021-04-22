export interface QuerySearchResponseDto {
  results: {id: string; description: string}[];
  status: Status;
}

export interface VerificationResponseDto {
  status: Status;
  formattedaddress: string;
  street: string;
  streetnumber: string;
  postalcode: string;
  city: string;
  county: string;
  country: string;
  district: string;
}

export type Status = 'UNVERIFIED' | 'SUSPECT' | 'INVALID' | 'VALID';

export interface RetrievedAddressDto {
  status: Status;
}

/*
{
  "status": "UNVERIFIED",
  "ratelimit_remain": 91,
  "ratelimit_seconds": 198,
  "cost": 0.2,
  "formattedaddress": "Straße des 17. Juni,10785 Berlin",
  "street": "Straße des 17. Juni",
  "postalcode": "10785",
  "city": "Berlin",
  "district": "Tiergarten",
  "county": "Berlin",
  "country": "DE"
}
 */

import { client } from './client';

export type AddressResult = {
  zipcode: string;
  address: string;
};

export const searchByZipcode = (zipcode: string) =>
  client.get<AddressResult[]>('/address/by-zipcode', { params: { code: zipcode } })
    .then(r => r.data);

export const searchByAddress = (address: string) =>
  client.get<AddressResult[]>('/address/by-address', { params: { q: address } })
    .then(r => r.data);

export interface Vehicle {
  id?: string; // UUID, optional for creation
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  imgUrl: string;
}

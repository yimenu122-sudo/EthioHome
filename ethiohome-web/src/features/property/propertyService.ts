export interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  type: 'rent' | 'sale';
  beds: number;
  baths: number;
  area: number;
  images: string[];
  description: string;
}

export const propertyService = {
  getProperties: async (): Promise<Property[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            title: 'Modern Apartment in Bole',
            price: 25000,
            location: 'Bole, Addis Ababa',
            type: 'rent',
            beds: 2,
            baths: 2,
            area: 120,
            images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
            description: 'Luxury apartment with city views.'
          },
          {
            id: '2',
            title: 'Villa for Sale in Ayat',
            price: 15000000,
            location: 'Ayat, Addis Ababa',
            type: 'sale',
            beds: 4,
            baths: 3,
            area: 300,
            images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914'],
            description: 'Spacious family home in a quiet neighborhood.'
          }
        ]);
      }, 800);
    });
  },

  getPropertyById: async (id: string): Promise<Property | undefined> => {
    const properties = await propertyService.getProperties();
    return properties.find(p => p.id === id);
  }
};

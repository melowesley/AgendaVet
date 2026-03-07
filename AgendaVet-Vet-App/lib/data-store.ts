/**
 * Data Store Hooks for Vet App
 * 
 * Simple hooks for fetching pets and other data
 */

import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: string;
  weight?: string;
  type?: string;
  owner_id?: string;
}

export function usePets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPets() {
      try {
        const { data, error } = await supabase
          .from('pets')
          .select('*')
          .order('name');

        if (error) throw error;
        setPets(data || []);
      } catch (error) {
        console.error('Error fetching pets:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPets();
  }, []);

  return { pets, loading };
}

export function usePet(petId: string | null) {
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!petId) {
      setLoading(false);
      return;
    }

    async function fetchPet() {
      try {
        const { data, error } = await supabase
          .from('pets')
          .select('*')
          .eq('id', petId)
          .single();

        if (error) throw error;
        setPet(data);
      } catch (error) {
        console.error('Error fetching pet:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPet();
  }, [petId]);

  return { pet, loading };
}

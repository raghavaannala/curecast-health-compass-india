import React, { useState } from 'react';
import styled from 'styled-components';
import { UserProfile } from '../types/health';

const Container = styled.div`
  max-width: 500px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;

  &:focus {
    border-color: #15803d;
    box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.1);
    outline: none;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;

  &:focus {
    border-color: #15803d;
    box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.1);
    outline: none;
  }
`;

const Button = styled.button`
  padding: 0.75rem;
  background: #15803d;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #166534;
  }

  &:disabled {
    background: #94a3b8;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.25rem;
`;

interface Props {
  onRegister: (profile: UserProfile) => void;
}

const UserRegistration: React.FC<Props> = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: '',
    location: '',
    language: 'english',
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    const newProfile: UserProfile = {
      id: Date.now().toString(),
      name: formData.name,
      phone: formData.phone || undefined,
      age: formData.age ? parseInt(formData.age) : undefined,
      gender: formData.gender as 'male' | 'female' | 'other' || undefined,
      location: formData.location || undefined,
      language: formData.language as 'english' | 'hindi' | 'tamil' | 'telugu',
      healthHistory: [],
      reminders: [],
    };

    onRegister(newProfile);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Container>
      <h2 style={{ color: '#15803d', marginBottom: '1.5rem' }}>Create Your Health Profile</h2>
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="name">Name *</Label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="phone">Phone Number (Optional)</Label>
          <Input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="10-digit phone number"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="age">Age (Optional)</Label>
          <Input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="Your age"
            min="0"
            max="120"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="gender">Gender (Optional)</Label>
          <Select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="location">Village/City (Optional)</Label>
          <Input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Your village or city"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="language">Preferred Language *</Label>
          <Select
            id="language"
            name="language"
            value={formData.language}
            onChange={handleChange}
            required
          >
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
            <option value="tamil">Tamil</option>
            <option value="telugu">Telugu</option>
          </Select>
        </FormGroup>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Button type="submit">Create Profile</Button>
      </Form>
    </Container>
  );
};

export default UserRegistration; 
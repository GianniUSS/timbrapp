// file: SkillsSelector.js
import React, { useState, useEffect } from 'react';
import {
  FormControl, InputLabel, Select, MenuItem, Box, Chip, CircularProgress
} from '@mui/material';
import api from '../api';

/**
 * Componente per la selezione delle competenze/skill
 * Carica dinamicamente le skill dal backend
 */
function SkillsSelector({ value, onChange, label = "Competenze", disabled = false }) {
  const [loading, setLoading] = useState(false);
  const [availableSkills, setAvailableSkills] = useState([]);
  
  // Caricamento delle competenze disponibili
  useEffect(() => {
    fetchAvailableSkills();
  }, []);
  
  // Funzione per caricare le competenze disponibili
  const fetchAvailableSkills = async () => {
    try {
      setLoading(true);
      const response = await api.funzioniSkill.getAllSkill();
      if (response.data && Array.isArray(response.data)) {
        // Estrai i nomi delle skill
        const skillNames = response.data.map(skill => skill.nome);
        setAvailableSkills(skillNames);
      } else {
        // Fallback in caso di formato dati inaspettato
        setAvailableSkills([
          'React', 'JavaScript', 'Node.js', 'HTML/CSS', 'UI/UX', 'Figma', 
          'Photoshop', 'Project Management', 'Agile', 'Scrum'
        ]);
      }
    } catch (err) {
      console.error('Errore nel caricamento delle competenze:', err);
      // Fallback alle competenze predefinite in caso di errore
      setAvailableSkills([
        'React', 'JavaScript', 'Node.js', 'HTML/CSS', 'UI/UX', 'Figma', 
        'Photoshop', 'Project Management', 'Agile', 'Scrum'
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  // Ordina le competenze alfabeticamente
  const sortedSkills = [...availableSkills].sort((a, b) => a.localeCompare(b));
  
  return (
    <FormControl fullWidth disabled={disabled || loading}>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={value}
        onChange={onChange}
        label={label}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((value) => (
              <Chip key={value} label={value} size="small" />
            ))}
          </Box>
        )}
        startAdornment={loading ? <CircularProgress size={20} sx={{ ml: 1 }} /> : null}
      >
        {sortedSkills.map(skill => (
          <MenuItem key={skill} value={skill}>
            {skill}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default SkillsSelector;

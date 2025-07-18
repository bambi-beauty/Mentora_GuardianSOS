// CharacterDetails.jsx
import React from "react";

const CharacterDetails = ({ character, onBack }) => {
  return (
    <div>
      <h2>Character Details</h2>
      <img src={character.image} alt={character.name} width="150" />
      <p><strong>Name:</strong> {character.name}</p>
      <p><strong>Actor:</strong> {character.actor}</p>
      <p><strong>House:</strong> {character.house}</p>
      <p><strong>Ancestry:</strong> {character.ancestry}</p>
      <p><strong>Species:</strong> {character.species}</p>
      <button onClick={onBack}>Back</button>
    </div>
  );
};

export default CharacterDetails;

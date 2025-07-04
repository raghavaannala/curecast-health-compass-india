import React from 'react';
import { Linkedin } from 'lucide-react';
import raghavaPhoto from './raghava.jpg';

const founderPhoto = raghavaPhoto;

const FoundersPage: React.FC = () => (
  <div className="max-w-2xl mx-auto py-12 px-4 flex flex-col items-center">
    <div className="bg-gradient-to-br from-yellow-200 to-yellow-50 rounded-2xl shadow-lg p-8 w-full flex flex-col items-center border-2 border-yellow-400">
      <img
        src={founderPhoto}
        alt="Raghava Annala"
        className="w-32 h-32 rounded-full border-4 border-yellow-400 shadow mb-4 object-cover bg-white"
      />
      <h1 className="text-3xl font-bold text-yellow-700 mb-2">Raghava Annala</h1>
      <h2 className="text-lg font-semibold text-yellow-600 mb-4">Founder, CureCast Health Compass</h2>
      <p className="text-center text-gray-700 text-lg mb-4 max-w-xl">
        Raghava Annala is the visionary founder of CureCast Health Compass, dedicated to making advanced, AI-powered health guidance accessible to everyone. With a passion for technology and healthcare, Raghava has built CureCast to empower users with instant, reliable medical insights, myth-busting facts, and a user-friendly experience. His commitment to excellence and innovation drives the platform's mission to improve health outcomes for all.
      </p>
      <div className="flex flex-col items-center gap-2 mt-4">
        <span className="text-yellow-700 font-medium">Contact:</span>
        <span className="text-gray-600">Email: <a href="mailto:annalaraghava0@gmail.com" className="underline">annalaraghava0@gmail.com</a></span>
        <span className="text-gray-600">Location: India</span>
        <a
          href="https://www.linkedin.com/in/annala-raghava-941a94281"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-full shadow hover:bg-yellow-600 transition-colors"
        >
          <Linkedin className="h-5 w-5" />
          LinkedIn
        </a>
      </div>
    </div>
  </div>
);

export default FoundersPage; 
import React, { useState, useEffect } from 'react';
import { VaccineEducationalInfo, VaccineType, Language } from '../types';
import { VaccineEducationTooltip } from './VaccineEducationTooltip';

interface VaccineEducationPanelProps {
  language: Language;
  searchQuery?: string;
}

interface VaccineDatabase {
  [key: string]: {
    info: VaccineEducationalInfo;
    type: VaccineType;
    commonQuestions: Array<{
      question: string;
      answer: string;
    }>;
  };
}

/**
 * Comprehensive Vaccine Education Panel
 * Provides detailed information about vaccines, FAQs, and educational content
 */
export const VaccineEducationPanel: React.FC<VaccineEducationPanelProps> = ({
  language,
  searchQuery = ''
}) => {
  const [selectedVaccine, setSelectedVaccine] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'faqs' | 'myths'>('overview');

  // Comprehensive vaccine database
  const vaccineDatabase: VaccineDatabase = {
    covid19: {
      info: {
        importance: 'COVID-19 vaccines are crucial for preventing severe illness, hospitalization, and death from COVID-19. They also help reduce transmission in communities.',
        description: 'mRNA or viral vector vaccines that provide immunity against SARS-CoV-2 virus',
        benefits: [
          'Prevents severe COVID-19 illness',
          'Reduces hospitalization risk by 90%+',
          'Protects against long COVID symptoms',
          'Helps achieve community immunity',
          'Safe for most people 6 months and older'
        ],
        risks: [
          'Mild arm soreness (very common)',
          'Fatigue and headache (common)',
          'Fever and chills (common)',
          'Allergic reactions (rare)',
          'Myocarditis (very rare, mostly in young males)'
        ],
        preparation: [
          'Inform about any allergies or medical conditions',
          'Bring vaccination card if available',
          'Stay hydrated before vaccination',
          'Wear loose-fitting clothing',
          'Plan to rest after vaccination if needed'
        ],
        afterCare: [
          'Monitor for side effects for 15-30 minutes',
          'Apply ice to injection site if sore',
          'Stay hydrated and rest if tired',
          'Contact healthcare provider for severe reactions',
          'Keep vaccination record updated'
        ],
        sources: ['WHO', 'CDC', 'Ministry of Health and Family Welfare', 'CoWIN']
      },
      type: {
        id: 'covid19',
        name: 'COVID-19 Vaccine',
        category: 'emergency',
        ageGroup: ['6 months+'],
        contraindications: ['Severe allergy to vaccine components', 'Active COVID-19 infection'],
        sideEffects: ['Pain at injection site', 'Fatigue', 'Headache', 'Muscle pain', 'Fever']
      },
      commonQuestions: [
        {
          question: 'How effective is the COVID-19 vaccine?',
          answer: 'COVID-19 vaccines are highly effective, preventing 90%+ of severe illness and hospitalization. Effectiveness may vary with different variants.'
        },
        {
          question: 'Can I get COVID-19 from the vaccine?',
          answer: 'No, COVID-19 vaccines cannot give you COVID-19. They contain either mRNA instructions or inactivated virus that cannot cause infection.'
        },
        {
          question: 'How long does immunity last?',
          answer: 'Immunity typically lasts 6-12 months, which is why booster doses are recommended to maintain protection.'
        }
      ]
    },
    hepatitisB: {
      info: {
        importance: 'Hepatitis B vaccine prevents a serious liver infection that can lead to liver cancer, cirrhosis, and death.',
        description: 'Recombinant vaccine that provides long-lasting immunity against Hepatitis B virus',
        benefits: [
          'Prevents chronic Hepatitis B infection',
          'Reduces liver cancer risk',
          'Provides lifelong immunity in most people',
          'Safe and highly effective (95%+)',
          'Protects against mother-to-child transmission'
        ],
        risks: [
          'Soreness at injection site (common)',
          'Low-grade fever (uncommon)',
          'Fatigue (uncommon)',
          'Severe allergic reactions (very rare)'
        ],
        preparation: [
          'Inform about pregnancy or immunocompromised status',
          'Complete the full 3-dose series',
          'Space doses according to schedule',
          'Bring vaccination records'
        ],
        afterCare: [
          'Complete all doses in the series',
          'Get blood test to confirm immunity if high-risk',
          'Keep vaccination records safe',
          'Report any severe reactions'
        ],
        sources: ['WHO', 'CDC', 'Indian Academy of Pediatrics', 'Ministry of Health']
      },
      type: {
        id: 'hepatitisB',
        name: 'Hepatitis B Vaccine',
        category: 'routine',
        ageGroup: ['Birth to adult'],
        contraindications: ['Severe illness', 'Allergy to vaccine components'],
        sideEffects: ['Injection site pain', 'Mild fever', 'Fatigue']
      },
      commonQuestions: [
        {
          question: 'Who should get the Hepatitis B vaccine?',
          answer: 'All infants, children, and adults at risk including healthcare workers, people with multiple partners, and those with chronic liver disease.'
        },
        {
          question: 'How many doses are needed?',
          answer: 'Three doses are typically needed: at birth, 1-2 months, and 6-18 months for infants. Adults follow a similar schedule.'
        }
      ]
    },
    tetanus: {
      info: {
        importance: 'Tetanus vaccine prevents a serious bacterial infection that causes painful muscle spasms and can be fatal.',
        description: 'Toxoid vaccine that provides immunity against tetanus bacteria toxin',
        benefits: [
          'Prevents tetanus infection (nearly 100% effective)',
          'Protects against lockjaw and muscle spasms',
          'Essential for wound protection',
          'Required for travel to many countries',
          'Safe during pregnancy'
        ],
        risks: [
          'Arm soreness and swelling (common)',
          'Low-grade fever (uncommon)',
          'Fatigue (uncommon)',
          'Severe reactions (very rare)'
        ],
        preparation: [
          'Check vaccination history',
          'Inform about pregnancy',
          'Mention any previous reactions',
          'Bring vaccination records'
        ],
        afterCare: [
          'Apply ice to reduce swelling',
          'Take pain relievers if needed',
          'Get booster every 10 years',
          'Get immediate booster for dirty wounds if >5 years since last dose'
        ],
        sources: ['WHO', 'CDC', 'Indian Medical Association', 'Ministry of Health']
      },
      type: {
        id: 'tetanus',
        name: 'Tetanus Vaccine (TT)',
        category: 'routine',
        ageGroup: ['All ages'],
        contraindications: ['Severe illness', 'Previous severe reaction'],
        sideEffects: ['Injection site pain', 'Swelling', 'Mild fever']
      },
      commonQuestions: [
        {
          question: 'How often do I need a tetanus shot?',
          answer: 'Adults need a tetanus booster every 10 years. For dirty wounds, you may need one sooner if it has been more than 5 years.'
        },
        {
          question: 'Is tetanus vaccine safe during pregnancy?',
          answer: 'Yes, tetanus vaccine is safe and recommended during pregnancy to protect both mother and baby.'
        }
      ]
    }
  };

  const getFilteredVaccines = () => {
    if (!searchTerm) return Object.entries(vaccineDatabase);
    
    return Object.entries(vaccineDatabase).filter(([key, vaccine]) =>
      vaccine.type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vaccine.info.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vaccine.type.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const mythsAndFacts = [
    {
      myth: 'Vaccines cause autism',
      fact: 'Extensive research has shown no link between vaccines and autism. The original study claiming this link was fraudulent and retracted.',
      source: 'CDC, WHO, Multiple peer-reviewed studies'
    },
    {
      myth: 'Natural immunity is better than vaccine immunity',
      fact: 'While natural immunity can be strong, vaccines provide safer immunity without the risks of severe disease, complications, or death.',
      source: 'WHO, CDC, Medical consensus'
    },
    {
      myth: 'Vaccines contain dangerous chemicals',
      fact: 'Vaccine ingredients are safe and necessary for effectiveness and preservation. The amounts are much smaller than what we encounter daily.',
      source: 'FDA, WHO, Vaccine safety monitoring'
    },
    {
      myth: 'Too many vaccines overwhelm the immune system',
      fact: 'The immune system can handle thousands of antigens daily. Vaccines contain far fewer antigens than a common cold.',
      source: 'Immunology research, Pediatric guidelines'
    }
  ];

  const vaccinationSchedule = {
    infants: [
      { age: 'Birth', vaccines: ['Hepatitis B', 'BCG', 'OPV-0'] },
      { age: '6 weeks', vaccines: ['DPT-1', 'OPV-1', 'Hepatitis B-2', 'Hib-1', 'Rotavirus-1', 'PCV-1'] },
      { age: '10 weeks', vaccines: ['DPT-2', 'OPV-2', 'Hib-2', 'Rotavirus-2', 'PCV-2'] },
      { age: '14 weeks', vaccines: ['DPT-3', 'OPV-3', 'Hib-3', 'Rotavirus-3', 'PCV-3', 'IPV-1'] }
    ],
    children: [
      { age: '9 months', vaccines: ['Measles-1', 'Vitamin A'] },
      { age: '12 months', vaccines: ['Hepatitis A-1'] },
      { age: '15 months', vaccines: ['MMR-1', 'Varicella-1', 'PCV Booster'] },
      { age: '18 months', vaccines: ['Hepatitis A-2', 'DPT Booster-1', 'OPV Booster'] }
    ],
    adults: [
      { age: '18+ years', vaccines: ['COVID-19', 'Influenza (annual)', 'Tetanus (every 10 years)'] },
      { age: 'Pregnant women', vaccines: ['TT', 'Influenza', 'Tdap'] },
      { age: '65+ years', vaccines: ['Pneumococcal', 'Zoster', 'High-dose Influenza'] }
    ]
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-green-50">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎓 Vaccine Education Center
        </h1>
        <p className="text-gray-600">
          Comprehensive information about vaccines, schedules, and health protection
        </p>
        
        {/* Search */}
        <div className="mt-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vaccines, conditions, or categories..."
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Vaccine Overview', icon: '💉' },
            { id: 'schedule', label: 'Vaccination Schedule', icon: '📅' },
            { id: 'faqs', label: 'FAQs', icon: '❓' },
            { id: 'myths', label: 'Myths vs Facts', icon: '🔍' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredVaccines().map(([key, vaccine]) => (
                <div
                  key={key}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedVaccine(selectedVaccine === key ? '' : key)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{vaccine.type.name}</h3>
                    <VaccineEducationTooltip vaccineInfo={vaccine.info}>
                      <span className="text-blue-500 hover:text-blue-700 cursor-help">ℹ️</span>
                    </VaccineEducationTooltip>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{vaccine.info.description}</p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded-full ${
                      vaccine.type.category === 'routine' ? 'bg-green-100 text-green-600' :
                      vaccine.type.category === 'emergency' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {vaccine.type.category}
                    </span>
                    <span className="text-gray-500">{vaccine.type.ageGroup.join(', ')}</span>
                  </div>

                  {selectedVaccine === key && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Key Benefits</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {vaccine.info.benefits.slice(0, 3).map((benefit, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-green-500 mr-2">✓</span>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Common Side Effects</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {vaccine.type.sideEffects.slice(0, 3).map((effect, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-yellow-500 mr-2">•</span>
                              {effect}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-8">
            {Object.entries(vaccinationSchedule).map(([ageGroup, schedules]) => (
              <div key={ageGroup}>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 capitalize">
                  {ageGroup} Vaccination Schedule
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Age
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vaccines
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {schedules.map((schedule, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {schedule.age}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="flex flex-wrap gap-2">
                              {schedule.vaccines.map((vaccine, vIndex) => (
                                <span
                                  key={vIndex}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                >
                                  {vaccine}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FAQs Tab */}
        {activeTab === 'faqs' && (
          <div className="space-y-6">
            {Object.entries(vaccineDatabase).map(([key, vaccine]) => (
              <div key={key} className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">{vaccine.type.name} - FAQs</h3>
                <div className="space-y-4">
                  {vaccine.commonQuestions.map((qa, index) => (
                    <div key={index}>
                      <h4 className="font-medium text-gray-900 mb-2">Q: {qa.question}</h4>
                      <p className="text-gray-700 text-sm pl-4 border-l-2 border-blue-200">
                        A: {qa.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Myths vs Facts Tab */}
        {activeTab === 'myths' && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h2 className="font-semibold text-yellow-800 mb-2">⚠️ Fighting Misinformation</h2>
              <p className="text-yellow-700 text-sm">
                Vaccine misinformation can be dangerous. Here are facts from trusted medical sources to help you make informed decisions.
              </p>
            </div>

            {mythsAndFacts.map((item, index) => (
              <div key={index} className="border rounded-lg p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-800 mb-2 flex items-center">
                      <span className="mr-2">❌</span>
                      Myth
                    </h3>
                    <p className="text-red-700">{item.myth}</p>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                      <span className="mr-2">✅</span>
                      Fact
                    </h3>
                    <p className="text-green-700 mb-2">{item.fact}</p>
                    <p className="text-green-600 text-xs">
                      <strong>Source:</strong> {item.source}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-gray-50 p-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Always consult with healthcare professionals for personalized medical advice
          </p>
          <div className="flex justify-center space-x-4 text-xs text-gray-500">
            <span>Sources: WHO, CDC, Ministry of Health</span>
            <span>•</span>
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaccineEducationPanel;

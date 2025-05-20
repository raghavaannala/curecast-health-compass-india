import React from 'react';
import { Info, Thermometer, HeartPulse, Wind, Smile } from 'lucide-react';

const CONDITION_FACTS = [
  {
    name: 'Fever',
    icon: <Thermometer className="h-6 w-6 text-red-500" />,
    color: 'from-red-100 to-red-50',
    facts: [
      'Most fevers are a sign your body is fighting infection.',
      'Stay hydrated—drink plenty of water or oral rehydration solutions.',
      'See a doctor if fever lasts more than 3 days or is above 102°F (39°C).',
    ],
  },
  {
    name: 'Wound Care',
    icon: <HeartPulse className="h-6 w-6 text-amber-600" />,
    color: 'from-amber-100 to-amber-50',
    facts: [
      'Clean wounds gently with clean water—avoid harsh soaps.',
      'Cover with a sterile bandage to prevent infection.',
      'See a doctor if the wound is deep, bleeding heavily, or shows signs of infection.',
    ],
  },
  {
    name: 'Cough',
    icon: <Wind className="h-6 w-6 text-blue-500" />,
    color: 'from-blue-100 to-blue-50',
    facts: [
      'Most coughs are caused by viral infections and go away on their own.',
      'Honey can soothe a sore throat and cough (not for children under 1).',
      'See a doctor if cough lasts more than 2 weeks or is accompanied by blood.',
    ],
  },
  {
    name: 'General Wellness',
    icon: <Smile className="h-6 w-6 text-emerald-500" />,
    color: 'from-emerald-100 to-emerald-50',
    facts: [
      'Washing hands regularly prevents many infections.',
      'A balanced diet and regular exercise boost immunity.',
      'Getting enough sleep helps your body heal and recover.',
    ],
  },
];

const HEALTH_FACTS = [
  {
    fact: "Your heart beats about 100,000 times a day, pumping 7,570 liters of blood!",
    icon: <Info className="h-6 w-6 text-red-500" />,
    color: "from-red-100 to-red-50"
  },
  {
    fact: "Laughter boosts your immune system and reduces stress hormones.",
    icon: <Info className="h-6 w-6 text-yellow-500" />,
    color: "from-yellow-100 to-yellow-50"
  },
  {
    fact: "Drinking water can improve your mood and memory.",
    icon: <Info className="h-6 w-6 text-blue-500" />,
    color: "from-blue-100 to-blue-50"
  },
  {
    fact: "Walking just 30 minutes a day can reduce your risk of heart disease by 30%.",
    icon: <Info className="h-6 w-6 text-green-500" />,
    color: "from-green-100 to-green-50"
  },
  {
    fact: "Your skin is your body's largest organ!",
    icon: <Info className="h-6 w-6 text-pink-500" />,
    color: "from-pink-100 to-pink-50"
  },
  {
    fact: "Bananas can help improve your mood because they contain tryptophan, which the body converts to serotonin.",
    icon: <Info className="h-6 w-6 text-yellow-600" />,
    color: "from-yellow-200 to-yellow-50"
  },
  {
    fact: "Smiling can trick your brain into feeling happier, even if you're not!",
    icon: <Info className="h-6 w-6 text-emerald-500" />,
    color: "from-emerald-100 to-emerald-50"
  },
  {
    fact: "Your bones are constantly being replaced—your entire skeleton renews itself every 10 years.",
    icon: <Info className="h-6 w-6 text-indigo-500" />,
    color: "from-indigo-100 to-indigo-50"
  },
];

const HealthFactsPage: React.FC = () => (
  <div className="max-w-3xl mx-auto py-10 px-4">
    <h1 className="text-3xl font-bold text-primary mb-4 text-center">Amazing Health Facts</h1>
    <p className="text-center text-muted-foreground mb-8 text-lg">Discover fun and surprising facts about your body and health!</p>

    {/* Quick Facts by Condition */}
    <div className="mb-10">
      <h2 className="text-xl font-semibold text-primary mb-4 text-center">Quick Facts by Condition</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {CONDITION_FACTS.map((cond, idx) => (
          <div
            key={idx}
            className={`rounded-xl bg-gradient-to-r ${cond.color} shadow p-5 flex flex-col gap-2 hover:scale-[1.03] transition-transform duration-200`}
          >
            <div className="flex items-center gap-2 mb-2">
              {cond.icon}
              <span className="font-bold text-lg text-gray-800">{cond.name}</span>
            </div>
            <ul className="list-disc list-inside text-gray-700 text-base space-y-1 pl-2">
              {cond.facts.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>

    {/* General Health Facts */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {HEALTH_FACTS.map((item, idx) => (
        <div
          key={idx}
          className={`flex items-center gap-4 p-5 rounded-xl bg-gradient-to-r ${item.color} shadow hover:scale-[1.03] transition-transform duration-200`}
        >
          <div className="shrink-0">{item.icon}</div>
          <span className="text-base font-medium text-gray-700">{item.fact}</span>
        </div>
      ))}
    </div>
  </div>
);

export default HealthFactsPage; 
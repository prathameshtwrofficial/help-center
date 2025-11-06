import React, { useEffect, useState } from "react";

interface TimeGreetingProps {
  userName: string;
  className?: string;
}

const getTimeBasedGreeting = (name: string) => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return {
      greeting: `Good morning, ${name}!`,
      icon: "🌅",
      color: "from-orange-400 to-yellow-500",
      bgColor: "bg-gradient-to-r from-orange-50 to-yellow-50"
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      greeting: `Good afternoon, ${name}!`,
      icon: "☀️",
      color: "from-blue-400 to-cyan-500",
      bgColor: "bg-gradient-to-r from-blue-50 to-cyan-50"
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      greeting: `Good evening, ${name}!`,
      icon: "🌇",
      color: "from-purple-400 to-pink-500",
      bgColor: "bg-gradient-to-r from-purple-50 to-pink-50"
    };
  } else {
    return {
      greeting: `Good night, ${name}!`,
      icon: "🌙",
      color: "from-indigo-400 to-purple-500",
      bgColor: "bg-gradient-to-r from-indigo-50 to-purple-50"
    };
  }
};

export default function TimeGreeting({ userName, className = "" }: TimeGreetingProps) {
  const [greeting, setGreeting] = useState(getTimeBasedGreeting(userName));

  useEffect(() => {
    setGreeting(getTimeBasedGreeting(userName));
  }, [userName]);

  return (
    <div className={`${greeting.bgColor} rounded-2xl p-6 ${className}`}>
      <div className="flex items-center gap-4">
        <div className={`text-4xl p-3 rounded-full bg-gradient-to-r ${greeting.color} text-white shadow-lg`}>
          {greeting.icon}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {greeting.greeting}
          </h2>
          <p className="text-gray-600">
            Welcome back! Ready to continue your learning journey?
          </p>
        </div>
      </div>
    </div>
  );
}
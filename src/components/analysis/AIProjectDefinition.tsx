import React from 'react';

interface AIProjectDefinitionProps {
  description: string;
  projectType: string;
  features: string[];
  technologies: string[];
  suggestion?: string;
  isAIAnalyzed: boolean;
}

export default function AIProjectDefinition({
  description,
  projectType,
  features,
  technologies,
  suggestion,
  isAIAnalyzed
}: AIProjectDefinitionProps) {
  if (!isAIAnalyzed) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-7 overflow-hidden">
      <div className="flex items-center mb-4">
        <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-purple-600 dark:text-purple-300" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI 프로젝트 분석</h2>
        <span className="ml-auto px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs rounded-full">
          GPT-4 Mini
        </span>
      </div>
      
      <div className="mb-5">
        <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">프로젝트 유형</h3>
        <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          {projectType}
        </p>
      </div>
      
      <div className="mb-5">
        <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">주요 기능</h3>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li 
              key={index} 
              className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg flex items-start"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="mb-5">
        <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">주요 기술</h3>
        <div className="flex flex-wrap gap-2">
          {technologies.map((tech, index) => (
            <span 
              key={index} 
              className="px-3 py-1.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
      
      {suggestion && (
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
          <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">개선 제안</h3>
          <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg italic">
            {suggestion}
          </p>
        </div>
      )}
    </div>
  );
} 
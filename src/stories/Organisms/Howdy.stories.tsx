import type { Meta, StoryObj } from '@storybook/nextjs'
import Howdy from '../../app/components/Howdy'

const meta: Meta<typeof Howdy> = {
  title: 'Organisms/Howdy',
  component: Howdy,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    imageSrc: {
      control: 'text',
      description: 'Source URL for the profile image'
    },
    imageAlt: {
      control: 'text',
      description: 'Alt text for the profile image'
    },
    greeting: {
      control: 'text',
      description: 'Main greeting text'
    },
    listItems: {
      control: 'object',
      description: 'Array of list items with emoji and text'
    },
    onSelectedWorksClick: {
      action: 'selected-works-clicked',
      description: 'Callback when "View selected work" button is clicked'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with current content
export const Default: Story = {
  args: {
    imageSrc: '/Levin_Home.jpg',
    imageAlt: 'David Levin',
    greeting: "Hi, I'm David 👋",
    listItems: [
      {
        emoji: "👷",
        text: "I orchestrate software architecture & design."
      },
      {
        emoji: "🚀", 
        text: "Fancy that, right? Lets make awesome happen."
      }
    ]
  }
};

// Story with different greeting
export const DifferentGreeting: Story = {
  args: {
    imageSrc: '/Levin_Home.jpg',
    imageAlt: 'David Levin',
    greeting: "Hello there! I'm David 🎉",
    listItems: [
      {
        emoji: "👷",
        text: "I orchestrate software architecture & design."
      },
      {
        emoji: "🚀", 
        text: "Fancy that, right? Lets make awesome happen."
      }
    ]
  }
};

// Story with more list items
export const MoreListItems: Story = {
  args: {
    imageSrc: '/Levin_Home.jpg',
    imageAlt: 'David Levin',
    greeting: "Hi, I'm David 👋",
    listItems: [
      {
        emoji: "👷",
        text: "I orchestrate software architecture & design."
      },
      {
        emoji: "🚀", 
        text: "Fancy that, right? Lets make awesome happen."
      },
      {
        emoji: "💡",
        text: "I love solving complex problems with elegant solutions."
      },
      {
        emoji: "🎯",
        text: "Focused on delivering exceptional user experiences."
      }
    ]
  }
};

// Story with different image
export const DifferentImage: Story = {
  args: {
    imageSrc: '/next.svg',
    imageAlt: 'Next.js Logo',
    greeting: "Hi, I'm David 👋",
    listItems: [
      {
        emoji: "👷",
        text: "I orchestrate software architecture & design."
      },
      {
        emoji: "🚀", 
        text: "Fancy that, right? Lets make awesome happen."
      }
    ]
  }
};

// Story with minimal content
export const Minimal: Story = {
  args: {
    imageSrc: '/Levin_Home.jpg',
    imageAlt: 'David Levin',
    greeting: "Hi 👋",
    listItems: [
      {
        emoji: "💼",
        text: "Software developer."
      }
    ]
  }
};

// Story with long text
export const LongText: Story = {
  args: {
    imageSrc: '/Levin_Home.jpg',
    imageAlt: 'David Levin',
    greeting: "Hello! I'm David and I'm passionate about creating amazing digital experiences 👨‍💻",
    listItems: [
      {
        emoji: "👷",
        text: "I orchestrate software architecture & design with a focus on scalability and maintainability."
      },
      {
        emoji: "🚀", 
        text: "Fancy that, right? Let's make awesome happen together and build something incredible!"
      },
      {
        emoji: "🎨",
        text: "I believe in the perfect balance between functionality and beautiful design."
      }
    ]
  }
};

// Story showing button click action
export const WithButtonAction: Story = {
  args: {
    imageSrc: '/Levin_Home.jpg',
    imageAlt: 'David Levin',
    greeting: "Hi, I'm David 👋",
    listItems: [
      {
        emoji: "👷",
        text: "I orchestrate software architecture & design."
      },
      {
        emoji: "🚀", 
        text: "Fancy that, right? Lets make awesome happen."
      }
    ],
    onSelectedWorksClick: () => {
      console.log('Selected works button clicked!');
      alert('Selected works button clicked!');
    }
  }
};

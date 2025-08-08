import type { Meta, StoryObj } from '@storybook/nextjs'
import Howdy from '../../app/components/Howdy'

const meta: Meta<typeof Howdy> = {
  title: 'Organisms/Howdy',
  component: Howdy,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onSelectedWorksClick: () => {},
  },
}

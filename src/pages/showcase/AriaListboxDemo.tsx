import { Up, Down } from '../shared/kbdIcons'
import { ax } from '@styles/ax'
import { ListBox } from '@os/ui/ListBox'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import { useStore } from '@os/store/useStore'

const demoData = createStore({
  entities: {
    apple: { id: 'apple', data: { label: 'Apple' } },
    banana: { id: 'banana', data: { label: 'Banana' } },
    cherry: { id: 'cherry', data: { label: 'Cherry' } },
    grape: { id: 'grape', data: { label: 'Grape' } },
  },
  relationships: {
    [ROOT_ID]: ['apple', 'banana', 'cherry', 'grape'],
  },
})

export default function AriaListboxDemo() {
  const [data, setData] = useStore(demoData)

  return (
    <>
      <div className="page-keys inline-flex flex-wrap items-center">
        <kbd><Up /><Down /></kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>
      </div>
      <div className={`card ${ax({ scroll: 'hidden' })}`}>
        <ListBox
          data={data}
          plugins={[]}
          onChange={setData}
          aria-label="Fruit picker"
        />
      </div>
    </>
  )
}

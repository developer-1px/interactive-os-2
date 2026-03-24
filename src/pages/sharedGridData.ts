import { createStore } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'

export const gridColumns = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'title', header: 'Title' },
  { key: 'department', header: 'Department' },
  { key: 'email', header: 'Email' },
  { key: 'location', header: 'Location' },
  { key: 'startDate', header: 'Start Date' },
]

export const gridInitialData = createStore({
  entities: {
    'row-1':  { id: 'row-1',  data: { cells: ['1001', 'Alice Johnson',    'Senior Engineer',      'Engineering',  'alice@acme.com',    'San Francisco', '2019-03-15'] } },
    'row-2':  { id: 'row-2',  data: { cells: ['1002', 'Bob Smith',         'Product Designer',     'Design',       'bob@acme.com',      'San Francisco', '2020-07-22'] } },
    'row-3':  { id: 'row-3',  data: { cells: ['1003', 'Carol Williams',    'Engineering Manager',  'Engineering',  'carol@acme.com',    'New York',      '2018-01-10'] } },
    'row-4':  { id: 'row-4',  data: { cells: ['1004', 'Dave Brown',        'Marketing Lead',       'Marketing',    'dave@acme.com',     'Chicago',       '2021-05-01'] } },
    'row-5':  { id: 'row-5',  data: { cells: ['1005', 'Eve Davis',         'Staff Engineer',       'Engineering',  'eve@acme.com',      'San Francisco', '2017-11-28'] } },
    'row-6':  { id: 'row-6',  data: { cells: ['1006', 'Frank Miller',      'UX Researcher',        'Design',       'frank@acme.com',    'Austin',        '2022-02-14'] } },
    'row-7':  { id: 'row-7',  data: { cells: ['1007', 'Grace Lee',         'Data Scientist',       'Engineering',  'grace@acme.com',    'Seattle',       '2020-09-03'] } },
    'row-8':  { id: 'row-8',  data: { cells: ['1008', 'Henry Wilson',      'Content Strategist',   'Marketing',    'henry@acme.com',    'Chicago',       '2021-11-15'] } },
    'row-9':  { id: 'row-9',  data: { cells: ['1009', 'Iris Chen',         'Frontend Engineer',    'Engineering',  'iris@acme.com',     'San Francisco', '2023-01-09'] } },
    'row-10': { id: 'row-10', data: { cells: ['1010', 'Jack Taylor',       'Product Manager',      'Product',      'jack@acme.com',     'New York',      '2019-06-20'] } },
    'row-11': { id: 'row-11', data: { cells: ['1011', 'Karen Martinez',    'DevOps Engineer',      'Engineering',  'karen@acme.com',    'Seattle',       '2020-04-07'] } },
    'row-12': { id: 'row-12', data: { cells: ['1012', 'Leo Garcia',        'Visual Designer',      'Design',       'leo@acme.com',      'Austin',        '2022-08-30'] } },
    'row-13': { id: 'row-13', data: { cells: ['1013', 'Mia Robinson',      'Backend Engineer',     'Engineering',  'mia@acme.com',      'San Francisco', '2021-03-12'] } },
    'row-14': { id: 'row-14', data: { cells: ['1014', 'Noah Kim',          'Sales Manager',        'Sales',        'noah@acme.com',     'Chicago',       '2018-10-25'] } },
    'row-15': { id: 'row-15', data: { cells: ['1015', 'Olivia Patel',      'QA Engineer',          'Engineering',  'olivia@acme.com',   'Seattle',       '2023-06-01'] } },
    'row-16': { id: 'row-16', data: { cells: ['1016', 'Paul Anderson',     'Technical Writer',     'Engineering',  'paul@acme.com',     'Austin',        '2022-12-05'] } },
    'row-17': { id: 'row-17', data: { cells: ['1017', 'Quinn Thomas',      'Growth Analyst',       'Marketing',    'quinn@acme.com',    'New York',      '2023-04-18'] } },
    'row-18': { id: 'row-18', data: { cells: ['1018', 'Rachel Scott',      'Platform Engineer',    'Engineering',  'rachel@acme.com',   'San Francisco', '2019-08-14'] } },
  },
  relationships: {
    [ROOT_ID]: [
      'row-1', 'row-2', 'row-3', 'row-4', 'row-5', 'row-6',
      'row-7', 'row-8', 'row-9', 'row-10', 'row-11', 'row-12',
      'row-13', 'row-14', 'row-15', 'row-16', 'row-17', 'row-18',
    ],
  },
})

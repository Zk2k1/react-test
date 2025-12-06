import { AudioOutlined } from '@ant-design/icons';
import { Input, Space, Button, Modal } from 'antd';
import React, { useState } from 'react';
import AddQuestion from './AddQuestion';

const { Search } = Input;
const suffix = (
  <AudioOutlined
    style={{
      fontSize: 16,
      color: '#1890ff',
    }}
  />
);
const App = ({ onSearch, onAdded }) => {
  const [open, setOpen] = useState(false);

  return (
    <Space direction="horizontal">
      <Search
        placeholder="请输入关键词"
        allowClear
        enterButton="查询题目"
        size="large"
        onSearch={(value) => {
          console.log('SearchQuestion: onSearch', value);
          onSearch && onSearch(value);
        }}
      />
      <Button type="primary" onClick={() => setOpen(true)}>
        添加题目
      </Button>
      <Modal
        title="添加题目"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnClose
      >
        <AddQuestion
          onAdded={() => {
            setOpen(false);
            onAdded && onAdded();
          }}
        />
      </Modal>
    </Space>
  );
};
export default App;
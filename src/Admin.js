import { UploadOutlined, UserOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { Layout,Menu } from 'antd';
import React from 'react';
import SearchUser from './components/SearchUser';
import UserTable from './components/UserTable';
import { useState } from 'react';
import SerchQuestion from './components/SearchQuestion';
import QuestionTable from './components/QuestionTable';
import Login from './components/Login';

const { Header, Footer, Sider, Content } = Layout;
const App = () => {
  const [selectedKey, setSelectedKey] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [userTableReload, setUserTableReload] = useState(0);
  const [questionQuery, setQuestionQuery] = useState('');
  const [questionReload, setQuestionReload] = useState(0);

  

  return (
  <>
    <Layout>
      <Header><h1 style={{color: '#ffffff'}}>Quiz管理系统</h1></Header>
      <Layout>
        <Sider>
          <Menu
            theme="dark"
            mode="inline"
            defaultSelectedKeys={['1']}
            onClick={({ key }) => setSelectedKey(key)}
            items={[
              { key: '1', icon: <UserOutlined />, label: '用户管理' },
              { key: '2', icon: <VideoCameraOutlined />, label: '题目管理' }
            ]}
          />
        </Sider> 
        <Content>
          {selectedKey === '1' && (
              <>
                <SearchUser onSearch={(value) => {
                  console.log('App: setSearchQuery ->', value);
                  setSearchQuery(value);
                }} onUserAdded={() => setUserTableReload((v) => v + 1)} />
                <UserTable searchQuery={searchQuery} reloadFlag={userTableReload} />
              </>
          )}
          {selectedKey === '2' && (
            <>
              <SerchQuestion
                onSearch={(value) => setQuestionQuery(value)}
                onAdded={() => setQuestionReload((v) => v + 1)}
              />
              <QuestionTable searchQuery={questionQuery} reloadFlag={questionReload} />
            </>
          )}
        </Content>

      </Layout>
            <Footer style={{
        textAlign: 'center',
      }}
      >Quiz管理系统 ©2025 Created by tfzhang</Footer>
    </Layout>
  </>
);
}
export default App;
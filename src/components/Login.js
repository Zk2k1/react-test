import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = ({ onLogin }) => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    //   const handleFinish = (values) => {
    //     setLoading(true);
    //     if (values.username === 'admin' && values.password === '123456') {
    //       message.success('登录成功');
    //       onLogin();
    //       navigate('/admin', { replace: true });
    //     } else {
    //       message.error('用户名或密码错误');
    //     }
    //     setLoading(false);
    //   };

    const handleFinish = async (values) => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8080/login', values);
            const result = response.data;
            if (result.code === 1) {
                localStorage.setItem('token', result.data);
                message.success('登录成功');
                onLogin();
                navigate('/Admin', { replace: true });
            } else {
                message.error('登录失败');
            }
        } catch (error) {
            message.error('网络错误');
        }
        setLoading(false);
    };

    return (
        <div style={{ maxWidth: 300, margin: '100px auto' }}>
            <h1 style={{ color: 'black' }}>Quiz管理系统登录</h1>
            <Form onFinish={handleFinish}>
                <Form.Item
                    name="username"
                    rules={[{ required: true, message: '请输入用户名' }]}
                >
                    <Input placeholder="用户名" />
                </Form.Item>
                <Form.Item
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                >
                    <Input.Password placeholder="密码" />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                        登录
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};
export default Login;
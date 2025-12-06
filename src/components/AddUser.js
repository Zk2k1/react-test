import { Form, Input, Button, message } from 'antd';
import React from 'react';
import axios from 'axios';

const formItemLayout = {
  labelCol: { xs: { span: 24 }, sm: { span: 8 } },
  wrapperCol: { xs: { span: 24 }, sm: { span: 16 } },
};
const tailFormItemLayout = {
  wrapperCol: { xs: { span: 24, offset: 0 }, sm: { span: 16, offset: 8 } },
};

const App = ({ onAdded }) => {
  const [form] = Form.useForm();
  const onFinish = (values) => {
    console.log('AddUser: submit values', values);
    const payload = {
      username: values.username,
      password: values.password,
      checkpassword: values.confirm,
    };
    axios.post('http://localhost:8080/register', payload)
      .then((resp) => {
        console.log('AddUser: register response', resp && resp.data);
        const data = resp && resp.data;
        if (data && data.code === 1) {
          message.success('添加用户成功');
          form.resetFields();
          onAdded && onAdded();
        } else {
          const msg = (data && data.msg) || '添加用户失败';
          message.error(msg);
        }
      })
      .catch((err) => {
        console.error('AddUser: register error', err);
        message.error('请求失败');
      });
  };
  return (
      <Form
        {...formItemLayout}
        form={form}
        name="register"
        onFinish={onFinish}
        scrollToFirstError
      >
        <Form.Item
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
        <Input />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[{
            required: true,
            message: 'Please input your password!',
          }]}
          hasFeedback
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          name="confirm"
          label="确认密码"
          dependencies={['password']}
          hasFeedback
          rules={[{
            required: true,
            message: 'Please confirm your password!',
          }, ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('The two passwords that you entered do not match!'));
            },
          })]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item {...tailFormItemLayout}>
          <Button type="primary" htmlType="submit">
            提交
          </Button>
        </Form.Item>
      </Form>
    );
  };
export default App;
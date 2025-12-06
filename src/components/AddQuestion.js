import React, { useState } from 'react';
import { Form, Input, Button, Select, message } from 'antd';
import axios from 'axios';

const AddQuestion = ({ onAdded, onSubmitted, mode = 'add', initialValues = {} }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 当传入初始值时填充表单
  React.useEffect(() => {
    if (initialValues) {
      const opts = initialValues.options || [initialValues.optionA, initialValues.optionB, initialValues.optionC, initialValues.optionD].filter(Boolean);
      const optionA = opts[0] || initialValues.optionA;
      const optionB = opts[1] || initialValues.optionB;
      const optionC = opts[2] || initialValues.optionC;
      const optionD = opts[3] || initialValues.optionD;
      let correctOption = initialValues.correctOption;
      if (!correctOption && initialValues.answer) {
        const ansLower = (initialValues.answer + '').toLowerCase();
        if ('abcd'.includes(ansLower)) correctOption = ansLower.toUpperCase();
        else {
          if (optionA && optionA === initialValues.answer) correctOption = 'A';
          else if (optionB && optionB === initialValues.answer) correctOption = 'B';
          else if (optionC && optionC === initialValues.answer) correctOption = 'C';
          else if (optionD && optionD === initialValues.answer) correctOption = 'D';
        }
      }
      form.setFieldsValue({
        questionText: initialValues.questionText || initialValues.question || initialValues.question_text,
        optionA,
        optionB,
        optionC,
        optionD,
        correctOption,
      });
    }
  }, [initialValues, form]);

  const onFinish = (values) => {
    if (submitting) return;
    const questionText = (values.questionText || '').trim();
    if (!questionText) {
      message.error('请输入题目');
      return;
    }
    const options = [values.optionA, values.optionB, values.optionC, values.optionD].map((s) => (s || '').trim());
    const hasEmpty = options.some((s) => !s);
    if (hasEmpty) {
      message.error('请填写完整四个选项');
      return;
    }
    const letterMap = { A: 0, B: 1, C: 2, D: 3 };
    const idx = letterMap[values.correctOption];
    const answerText = idx != null ? options[idx] : '';
    const answerLetter = values.correctOption ? values.correctOption.toLowerCase() : '';
    // 按后端可用的 Vue 版本对齐字段：question/optiona-d/answer(letter)
    const payload = {
      question: questionText,
      optiona: options[0],
      optionb: options[1],
      optionc: options[2],
      optiond: options[3],
      answer: answerLetter,
    };
    if (mode === 'edit' && initialValues.id) {
      payload.id = initialValues.id;
    }
    console.log('AddQuestion: payload', payload);
    setSubmitting(true);
    const url = mode === 'edit' ? 'http://localhost:8080/updateQuestion' : 'http://localhost:8080/addQuestion';
    const token = localStorage.getItem('token');
    axios.post(url, payload, { validateStatus: () => true, headers: { token } })
      .then((resp) => {
        const data = resp && resp.data;
        if (resp && resp.status === 401) {
          message.error('未登录或登录已过期');
          return;
        }
        const success = resp && resp.status >= 200 && resp.status < 300 && data && data.code === 1;
        if (success) {
          message.success(mode === 'edit' ? '编辑题目成功' : '添加题目成功');
          form.resetFields();
          (onSubmitted || onAdded) && (onSubmitted || onAdded)();
        } else {
          message.error((data && data.msg) || `添加题目失败 (status ${resp && resp.status})`);
          console.error('AddQuestion: failed', { status: resp && resp.status, data });
        }
      })
      .catch((err) => {
        console.error('AddQuestion: request error', err);
        message.error('请求失败');
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item
        name="questionText"
        label="题目"
        rules={[{ required: true, message: '请输入题目' }]}
      >
        <Input.TextArea rows={3} />
      </Form.Item>

      <Form.Item
        name="optionA"
        label="选项A"
        rules={[{ required: true, message: '请输入选项A' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="optionB"
        label="选项B"
        rules={[{ required: true, message: '请输入选项B' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="optionC"
        label="选项C"
        rules={[{ required: true, message: '请输入选项C' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="optionD"
        label="选项D"
        rules={[{ required: true, message: '请输入选项D' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="correctOption"
        label="正确答案"
        rules={[{ required: true, message: '请选择正确答案' }]}
      >
        <Select
          placeholder="请选择正确答案"
          options={[
            { label: '选项A', value: 'A' },
            { label: '选项B', value: 'B' },
            { label: '选项C', value: 'C' },
            { label: '选项D', value: 'D' },
          ]}
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={submitting} disabled={submitting}>
          提交
        </Button>
      </Form.Item>
    </Form>
  );
};

export default AddQuestion;

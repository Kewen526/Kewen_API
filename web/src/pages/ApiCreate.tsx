import { Card, Form, Input, Select, Button, Switch, InputNumber, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { apiApi } from '../api/api';
import { dataSourceApi } from '../api/datasource';
import Editor from '@monaco-editor/react';

export default function ApiCreate() {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const { data: dataSources } = useQuery('datasources', () =>
    dataSourceApi.list({ pageSize: 100 })
  );

  const createMutation = useMutation(apiApi.create, {
    onSuccess: () => {
      message.success('API 创建成功！');
      navigate('/apis');
    },
  });

  const handleSubmit = (values: any) => {
    createMutation.mutate(values);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>创建 API</h2>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            method: 'GET',
            version: 'v1',
            cacheEnabled: true,
            cacheTtl: 300,
            rateLimitEnabled: true,
            rateLimit: 60,
            requireAuth: true,
          }}
        >
          <Form.Item
            label="API 名称"
            name="name"
            rules={[{ required: true, message: '请输入 API 名称' }]}
          >
            <Input placeholder="获取用户列表" />
          </Form.Item>

          <Form.Item
            label="请求路径"
            name="path"
            rules={[{ required: true, message: '请输入请求路径' }]}
          >
            <Input placeholder="/users" addonBefore="/" />
          </Form.Item>

          <Form.Item
            label="请求方法"
            name="method"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="GET">GET</Select.Option>
              <Select.Option value="POST">POST</Select.Option>
              <Select.Option value="PUT">PUT</Select.Option>
              <Select.Option value="DELETE">DELETE</Select.Option>
              <Select.Option value="PATCH">PATCH</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="版本"
            name="version"
            rules={[{ required: true }]}
          >
            <Input placeholder="v1" />
          </Form.Item>

          <Form.Item
            label="数据源"
            name="dataSourceId"
            rules={[{ required: true, message: '请选择数据源' }]}
          >
            <Select
              placeholder="请选择数据源"
              options={dataSources?.data?.map((ds: any) => ({
                label: `${ds.name} (${ds.type})`,
                value: ds.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="SQL 查询"
            name="sql"
            rules={[{ required: true, message: '请输入 SQL 查询' }]}
          >
            <Editor
              height="200px"
              language="sql"
              theme="vs-dark"
              defaultValue="SELECT * FROM users WHERE id = ${userId} LIMIT 10;"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
              }}
              onChange={(value) => form.setFieldValue('sql', value)}
            />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} placeholder="API 的详细描述" />
          </Form.Item>

          <Form.Item label="启用缓存" name="cacheEnabled" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            label="缓存时长（秒）"
            name="cacheTtl"
            dependencies={['cacheEnabled']}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="启用限流" name="rateLimitEnabled" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            label="限流（次/分钟）"
            name="rateLimit"
            dependencies={['rateLimitEnabled']}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="需要认证" name="requireAuth" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isLoading}
              style={{ marginRight: 8 }}
            >
              创建
            </Button>
            <Button onClick={() => navigate('/apis')}>取消</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

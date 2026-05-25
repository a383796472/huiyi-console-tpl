<template>
  <div class="editor-container">
    <!-- 工具栏 -->
    <Toolbar
      style="border-bottom: 1px solid #ccc"
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      :mode="mode"
    />
    <!-- 编辑器 -->
    <Editor
      v-model="valueHtml"
      style="height: 400px;"
      :defaultConfig="editorConfig"
      :mode="mode"
      @onCreated="handleCreated"
      @onChange="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css' // 引入 css
import { onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef()

// 内容 HTML
const valueHtml = ref('')

// 模拟受控组件：接收父组件的 v-model
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})
const emit = defineEmits(['update:modelValue'])

// 监听外部传入的值变化
watch(
  () => props.modelValue,
  (val) => {
    if (valueHtml.value !== val) {
      valueHtml.value = val
    }
  },
  { immediate: true }
)

// 监听内部值变化并抛出
const handleChange = (editor: any) => {
  emit('update:modelValue', editor.getHtml())
}

const handleCreated = (editor: any) => {
  editorRef.value = editor // 记录 editor 实例，重要！
}

// 组件销毁时，也及时销毁 editor
onBeforeUnmount(() => {
  if (editorRef.value == null) return
  editorRef.value.destroy()
  editorRef.value = null
})

// 编辑器配置
const mode = 'default' // 或 'simple' 简约模式
const toolbarConfig = {}
const editorConfig = {
  placeholder: '请输入内容...',
  MENU_CONF: {
    // 这里可以配置上传图片等
    uploadImage: {
      fieldName: 'your-file-name',
      // base64 转存，或上传到服务器
      customInsert(res: any, insertFn: any) {
        insertFn(res.url, 'image', res.alt)
      }
    }
  }
}
</script>

<style scoped>
.editor-container {
  border: 1px solid #ccc;
  border-radius: 4px;
  z-index: 100; /* 防止被其他元素遮挡 */
}
</style>
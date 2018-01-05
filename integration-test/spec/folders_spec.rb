#!/usr/bin/env ruby

require './spec/spec_helper'

describe 'The Folders plugin' do
  before do
    @user = admin_session.create_test_user
    page.log_in_as(@user)
    page.create_document_set_from_pdfs_in_folder('files/folders-spec')
    page.create_custom_view(name: 'Folders', url: 'http://overview-file-browser')
  end

  after do
    admin_session.destroy_test_user(@user)
  end

  it 'should search by folder' do
    page.within_frame('view-app-iframe') do
      page.click_on('folders-spec', wait: WAIT_LOAD)
      page.click_on('dir1', wait: WAIT_FAST)
    end
    # This is _filtering_: wait for a document to disappear, then we know it's done
    page.assert_no_selector('h3', text: 'dir3/doc4.pdf', wait: WAIT_LOAD)
    page.assert_selector('h3', text: 'dir1/dir2/doc1.pdf')
    page.assert_selector('h3', text: 'dir1/doc3.pdf')
  end

  it 'should search by subfolder' do
    page.within_frame('view-app-iframe') do
      page.click_on('folders-spec', wait: WAIT_LOAD)
      page.click_on('dir1', wait: WAIT_FAST)
      page.click_on('dir2', wait: WAIT_FAST)
    end
    # This is _filtering_: wait for a document to disappear, then we know it's done
    page.assert_no_selector('h3', text: 'dir3/doc4.pdf', wait: WAIT_LOAD)
    page.assert_selector('h3', text: 'dir1/dir2/doc1.pdf')
    page.assert_selector('h3', text: 'dir1/dir2/doc2.pdf')
    page.assert_no_selector('h3', text: 'dir1/doc3.pdf')
  end

  it 'should remember open folder after restart' do
    page.within_frame('view-app-iframe') do
      page.click_on('folders-spec', wait: WAIT_LOAD)
      page.click_on('dir1', wait: WAIT_FAST)
      sleep 1 # HACK -- wait for the state to be saved
    end
    page.refresh
    page.within_frame('view-app-iframe', wait: WAIT_LOAD) do
      # "folders-spec/dir1/dir2" will only be visible if the state loads,
      # opening "folders-spec/dir1/".
      page.assert_selector('a', text: 'dir2', wait: WAIT_LOAD)
    end
    # Assert we're filtering correctly: documents that appeared on load should
    # disappear now.
    page.assert_no_selector('h3', text: 'dir3/doc4.pdf', wait: WAIT_LOAD)
  end
end
